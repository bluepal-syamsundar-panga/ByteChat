package com.bytechat.serviceimpl;

import com.bytechat.dto.request.CreateWorkspaceRequest;
import com.bytechat.dto.request.InviteUserRequest;
import com.bytechat.dto.response.WorkspaceResponse;
import com.bytechat.dto.response.UserResponse;
import com.bytechat.dto.response.WorkspaceCreationResponse;
import com.bytechat.dto.response.AuthResponse;
import com.bytechat.entity.*;
import com.bytechat.repository.*;
import com.bytechat.services.ChannelService;
import com.bytechat.services.NotificationService;
import com.bytechat.services.WorkspaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;
import com.bytechat.services.EmailService;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkspaceServiceImpl implements WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;
    private final ChannelService channelService;
    private final ChannelRepository channelRepository;
    private final ChannelMemberRepository channelMemberRepository;
    private final com.bytechat.services.OtpService otpService;
    private final com.bytechat.config.JwtService jwtService;
    private final EmailService emailService;

    @Override
    @Transactional
    public WorkspaceResponse createWorkspace(CreateWorkspaceRequest request, User currentUser) {
        Workspace workspace = Workspace.builder()
                .name(request.getName())
                .description(request.getDescription())
                .isPrivate(request.isPrivate())
                .owner(currentUser)
                .build();
                
        workspace = workspaceRepository.save(workspace);
        
        // Add creator as owner automatically
        WorkspaceMember member = WorkspaceMember.builder()
                .workspace(workspace)
                .user(currentUser)
                .role(WorkspaceRole.OWNER)
                .build();
        workspaceMemberRepository.save(member);

        // Create default #general channel
        channelService.createChannel(workspace.getId(), "general", "Default channel for " + workspace.getName(), false, true, currentUser);
        
        // Send workspace success email
        try {
            emailService.sendWorkspaceSuccess(currentUser.getEmail(), workspace.getName(), workspace.getDescription());
        } catch (Exception e) {
            log.error("Failed to send workspace creation success email: {}", e.getMessage());
        }

        return mapToResponse(workspace, currentUser);
    }

    @Override
    @Transactional
    public WorkspaceCreationResponse createWorkspaceWithDetails(CreateWorkspaceRequest request, String email, User currentUser) {
        User workspaceOwner = null;
        if (currentUser != null) {
            workspaceOwner = userRepository.findById(currentUser.getId())
                    .orElse(currentUser);
        }
        
        if (workspaceOwner == null) {
            workspaceOwner = userRepository.findByEmail(email).orElseGet(() -> {
                User newUser = User.builder()
                        .email(email)
                        .displayName(email.split("@")[0])
                        .password("OTP_USER")
                        .role(Role.OWNER)
                        .build();
                return userRepository.save(newUser);
            });
        }

        WorkspaceResponse workspaceResponse = createWorkspace(request, workspaceOwner);

        String accessToken = jwtService.generateToken(workspaceOwner);
        String refreshToken = jwtService.generateRefreshToken(workspaceOwner);

        AuthResponse authResponse = AuthResponse.of(
            accessToken,
            refreshToken,
            workspaceOwner.getEmail(),
            workspaceOwner.getDisplayName(),
            workspaceOwner.getAvatarUrl(),
            workspaceOwner.getId(),
            workspaceOwner.getRole() != null ? workspaceOwner.getRole().name() : "OWNER"
        );

        otpService.clearOtp(email);

        return WorkspaceCreationResponse.builder()
                .workspace(workspaceResponse)
                .auth(authResponse)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkspaceResponse> getUserWorkspaces(User currentUser, int page, int size) {
        return workspaceRepository.findJoinedWorkspaces(currentUser.getId(), PageRequest.of(page, size))
                .map(ws -> mapToResponse(ws, currentUser));
    }

    @Override
    @Transactional
    public void joinWorkspace(Long workspaceId, User currentUser) {
        log.info("User {} joining workspace {}", currentUser.getEmail(), workspaceId);
        Workspace workspace = getWorkspaceOrThrow(workspaceId);
        
        if (workspace.isArchived()) {
            log.warn("Join failed: Workspace {} is archived", workspaceId);
            throw new RuntimeException("Cannot join archived workspace");
        }
        
        if (workspace.isPrivate() && !workspace.getOwner().getId().equals(currentUser.getId())) {
             log.warn("Join failed: Workspace {} is private and user {} is not owner", workspaceId, currentUser.getEmail());
            throw new RuntimeException("Cannot join private workspace without invite");
        }
        
        if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, currentUser.getId())) {
            WorkspaceMember member = WorkspaceMember.builder()
                    .workspace(workspace)
                    .user(currentUser)
                    .role(WorkspaceRole.MEMBER)
                    .build();
            workspaceMemberRepository.save(member);
            log.info("User {} added as member to workspace {}", currentUser.getEmail(), workspaceId);
            
            // Add to default channel
            List<Channel> channels = channelRepository.findByWorkspaceId(workspaceId);
            for (Channel channel : channels) {
                if (channel.isDefault()) {
                    if (!channelMemberRepository.existsByChannelIdAndUserId(channel.getId(), currentUser.getId())) {
                        ChannelMember cm = ChannelMember.builder()
                                .channel(channel)
                                .user(currentUser)
                                .role(ChannelRole.MEMBER)
                                .build();
                        channelMemberRepository.save(cm);
                        log.info("User {} added to default channel {} in workspace {}", currentUser.getEmail(), channel.getName(), workspaceId);
                    }
                }
            }
        }
    }

    @Override
    @Transactional
    public void leaveWorkspace(Long workspaceId, User currentUser) {
        log.info("User {} leaving workspace {}", currentUser.getEmail(), workspaceId);
        WorkspaceMember member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, currentUser.getId())
                .orElseThrow(() -> new com.bytechat.exception.ResourceNotFoundException("Not a member of this workspace"));
        
        if (WorkspaceRole.OWNER.equals(member.getRole())) {
            log.warn("Leave failed: Owner {} cannot leave workspace {}", currentUser.getEmail(), workspaceId);
            throw new RuntimeException("Workspace Owner cannot leave. Transfer ownership or delete the workspace.");
        }

        removeUserFromWorkspaceInternally(workspaceId, currentUser);
        log.info("User {} successfully left workspace {}", currentUser.getEmail(), workspaceId);
    }

    @Override
    @Transactional
    public void removeMember(Long workspaceId, Long userId, User currentUser) {
        log.info("Removing member {} from workspace {} by user {}", userId, workspaceId, currentUser.getEmail());
        Workspace workspace = getWorkspaceOrThrow(workspaceId);
        
        if (!workspace.getOwner().getId().equals(currentUser.getId())) {
            log.warn("Remove failed: User {} is not the owner of workspace {}", currentUser.getEmail(), workspaceId);
            throw new com.bytechat.exception.UnauthorizedException("Only the workspace owner can remove members.");
        }

        if (workspace.getOwner().getId().equals(userId)) {
            log.warn("Remove failed: Owner cannot remove themselves from workspace {}", workspaceId);
            throw new RuntimeException("Owner cannot be removed from their own workspace.");
        }

        User userToRemove = userRepository.findById(userId)
                .orElseThrow(() -> new com.bytechat.exception.ResourceNotFoundException("User not found"));

        removeUserFromWorkspaceInternally(workspaceId, userToRemove);
        log.info("Member {} removed from workspace {}", userId, workspaceId);
    }

    private void removeUserFromWorkspaceInternally(Long workspaceId, User user) {
        Workspace workspace = getWorkspaceOrThrow(workspaceId);
        User owner = workspace.getOwner();

        // 1. Reassign Admin roles for all channels where this user was Admin
        List<ChannelMember> memberships = channelMemberRepository.findByWorkspaceIdAndUserId(workspaceId, user.getId());
        for (ChannelMember cm : memberships) {
            if (ChannelRole.ADMIN.equals(cm.getRole())) {
                List<ChannelMember> otherAdmins = channelMemberRepository.findByChannelId(cm.getChannel().getId()).stream()
                        .filter(other -> !other.getUser().getId().equals(user.getId()) && ChannelRole.ADMIN.equals(other.getRole()))
                        .toList();
                
                if (otherAdmins.isEmpty()) {
                    if (!channelMemberRepository.existsByChannelIdAndUserId(cm.getChannel().getId(), owner.getId())) {
                         ChannelMember ownerNewCm = ChannelMember.builder()
                                 .channel(cm.getChannel())
                                 .user(owner)
                                 .role(ChannelRole.ADMIN)
                                 .build();
                         channelMemberRepository.save(ownerNewCm);
                         log.info("Transferred Channel ADMIN from {} to Workspace Owner {} for channel {}", user.getEmail(), owner.getEmail(), cm.getChannel().getName());
                    } else {
                        ChannelMember ownerCm = channelMemberRepository.findByChannelIdAndUserId(cm.getChannel().getId(), owner.getId()).get();
                        ownerCm.setRole(ChannelRole.ADMIN);
                        channelMemberRepository.save(ownerCm);
                        log.info("Promoted Workspace Owner {} to Channel ADMIN for channel {}", owner.getEmail(), cm.getChannel().getName());
                    }
                }
            }
        }

        // 2. Remove from all channel memberships
        for (ChannelMember cm : memberships) {
            channelMemberRepository.delete(cm);
        }

        // 3. Remove from workspace
        workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, user.getId())
                .ifPresent(workspaceMemberRepository::delete);
    }

    @Override
    @Transactional
    public void archiveWorkspace(Long workspaceId, User currentUser) {
        log.info("Archiving workspace {} by user {}", workspaceId, currentUser.getEmail());
        Workspace workspace = getWorkspaceOrThrow(workspaceId);
        if (!workspace.getOwner().getId().equals(currentUser.getId())) {
             log.warn("Archive failed: User {} is not the owner of workspace {}", currentUser.getEmail(), workspaceId);
            throw new com.bytechat.exception.UnauthorizedException("Only owner can archive the workspace");
        }
        workspace.setArchived(true);
        workspaceRepository.save(workspace);
        log.info("Workspace {} archived successfully", workspaceId);
    }

    @Override
    @Transactional
    public void inviteUser(Long workspaceId, String email, User currentUser) {
        log.info("Inviting user {} to workspace {} by user {}", email, workspaceId, currentUser.getEmail());
        Workspace workspace = getWorkspaceOrThrow(workspaceId);
        User invitedUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new com.bytechat.exception.ResourceNotFoundException("User not found with email: " + email));

        if (workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, invitedUser.getId())) {
            log.warn("Invitation failed: User {} is already in workspace {}", email, workspaceId);
            throw new com.bytechat.exception.ConflictException("User is already in this workspace");
        }

        notificationService.sendNotification(
                invitedUser.getId(),
                "WORKSPACE_INVITE",
                currentUser.getDisplayName() + " invited you to join workspace " + workspace.getName(),
                workspace.getId()
        );

        // Send invitation email
        try {
            emailService.sendInvitation(email, currentUser.getDisplayName(), workspace.getName(), workspace.getName(), "WORKSPACE");
            log.info("Invitation email sent to {} for workspace {}", email, workspace.getName());
        } catch (Exception e) {
            log.error("Failed to send workspace invitation email to {}: {}", email, e.getMessage());
        }
    }

    @Override
    @Transactional
    public void inviteUser(Long workspaceId, InviteUserRequest request, User currentUser) {
        inviteUser(workspaceId, request.getEmail(), currentUser);
    }

    @Override
    @Transactional
    public void acceptInvite(Long notificationId, User currentUser) {
        log.info("User {} accepting invite from notification {}", currentUser.getEmail(), notificationId);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new com.bytechat.exception.ResourceNotFoundException("Notification not found"));

        if (!notification.getRecipient().getId().equals(currentUser.getId())) {
            log.warn("Invite accept failed: Notification {} does not belong to user {}", notificationId, currentUser.getEmail());
            throw new com.bytechat.exception.UnauthorizedException("Cannot accept another user's invite");
        }

        if (!"WORKSPACE_INVITE".equals(notification.getType())) {
            log.warn("Invite accept failed: Notification {} is not a workspace invite", notificationId);
            throw new RuntimeException("Notification is not a workspace invite");
        }

        Long workspaceId = notification.getRelatedEntityId();
        if (workspaceId == null) {
            log.error("Invite accept failed: Notification {} missing workspace ID", notificationId);
            throw new RuntimeException("Invite notification is missing workspace information");
        }

        joinWorkspace(workspaceId, currentUser);

        notification.setRead(true);
        notificationRepository.save(notification);
        log.info("User {} successfully accepted invite to workspace {}", currentUser.getEmail(), workspaceId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getWorkspaceMembers(Long workspaceId, User currentUser) {
        if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, currentUser.getId())) {
            throw new RuntimeException("You are not a member of this workspace");
        }

        return workspaceMemberRepository.findByWorkspaceId(workspaceId).stream()
                .map(WorkspaceMember::getUser)
                .map(this::mapUser)
                .toList();
    }

    private Workspace getWorkspaceOrThrow(Long workspaceId) {
        return workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new RuntimeException("Workspace not found"));
    }

    private WorkspaceResponse mapToResponse(Workspace workspace) {
        if (workspace == null) return null;
        return WorkspaceResponse.builder()
                .id(workspace.getId())
                .name(workspace.getName())
                .description(workspace.getDescription())
                .isPrivate(workspace.isPrivate())
                .isArchived(workspace.isArchived())
                .createdById(workspace.getOwner() != null ? workspace.getOwner().getId() : null)
                .createdAt(workspace.getCreatedAt())
                .build();
    }

    private WorkspaceResponse mapToResponse(Workspace workspace, User currentUser) {
        if (workspace == null) return null;
        String role = "MEMBER";
        if (currentUser != null) {
            role = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspace.getId(), currentUser.getId())
                    .map(m -> m.getRole().name())
                    .orElse("MEMBER");
        }
        
        return WorkspaceResponse.builder()
                .id(workspace.getId())
                .name(workspace.getName())
                .description(workspace.getDescription())
                .isPrivate(workspace.isPrivate())
                .isArchived(workspace.isArchived())
                .createdById(workspace.getOwner() != null ? workspace.getOwner().getId() : null)
                .createdAt(workspace.getCreatedAt())
                .role(role)
                .build();
    }

    private UserResponse mapUser(User user) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .lastSeen(user.getLastSeen())
                .online(user.isOnline())
                .role(user.getRole() != null ? user.getRole().name() : "MEMBER")
                .build();
    }
}
