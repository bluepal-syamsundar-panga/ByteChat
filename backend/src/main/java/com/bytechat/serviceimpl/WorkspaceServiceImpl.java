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

import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkspaceServiceImpl implements WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;
    private final ChannelService channelService;
    private final ChannelRepository channelRepository;
    private final com.bytechat.services.OtpService otpService;
    private final com.bytechat.config.JwtService jwtService;

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
        channelService.createChannel(workspace.getId(), "general", "Default channel for " + workspace.getName(), true, currentUser);
        
        return mapToResponse(workspace);
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
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public void joinWorkspace(Long workspaceId, User currentUser) {
        Workspace workspace = getWorkspaceOrThrow(workspaceId);
        
        if (workspace.isArchived()) {
            throw new RuntimeException("Cannot join archived workspace");
        }
        
        if (workspace.isPrivate() && !workspace.getOwner().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Cannot join private workspace without invite");
        }
        
        if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, currentUser.getId())) {
            WorkspaceMember member = WorkspaceMember.builder()
                    .workspace(workspace)
                    .user(currentUser)
                    .role(WorkspaceRole.MEMBER)
                    .build();
            workspaceMemberRepository.save(member);
            
            // Add to default channel
            List<Channel> channels = channelRepository.findByWorkspaceId(workspaceId);
            for (Channel channel : channels) {
                if (channel.isDefault()) {
                    channel.getMembers().add(currentUser);
                    channelRepository.save(channel);
                }
            }
        }
    }

    @Override
    @Transactional
    public void leaveWorkspace(Long workspaceId, User currentUser) {
        workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, currentUser.getId())
                .ifPresent(workspaceMemberRepository::delete);
    }

    @Override
    @Transactional
    public void archiveWorkspace(Long workspaceId, User currentUser) {
        Workspace workspace = getWorkspaceOrThrow(workspaceId);
        
        if (!workspace.getOwner().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only owner can archive the workspace");
        }
        
        workspace.setArchived(true);
        workspaceRepository.save(workspace);
    }

    @Override
    @Transactional
    public void inviteUser(Long workspaceId, String email, User currentUser) {
        Workspace workspace = getWorkspaceOrThrow(workspaceId);

        User invitedUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));

        if (workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, invitedUser.getId())) {
            throw new IllegalArgumentException("User is already in this workspace");
        }

        notificationService.sendNotification(
                invitedUser.getId(),
                "WORKSPACE_INVITE",
                currentUser.getDisplayName() + " invited you to join workspace " + workspace.getName(),
                workspace.getId()
        );
    }

    @Override
    @Transactional
    public void inviteUser(Long workspaceId, InviteUserRequest request, User currentUser) {
        inviteUser(workspaceId, request.getEmail(), currentUser);
    }

    @Override
    @Transactional
    public void acceptInvite(Long notificationId, User currentUser) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getRecipient().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Cannot accept another user's invite");
        }

        if (!"WORKSPACE_INVITE".equals(notification.getType())) {
            throw new RuntimeException("Notification is not a workspace invite");
        }

        Long workspaceId = notification.getRelatedEntityId();
        if (workspaceId == null) {
            throw new RuntimeException("Invite notification is missing workspace information");
        }

        if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, currentUser.getId())) {
            Workspace workspace = getWorkspaceOrThrow(workspaceId);
            workspaceMemberRepository.save(WorkspaceMember.builder()
                    .workspace(workspace)
                    .user(currentUser)
                    .role(WorkspaceRole.MEMBER)
                    .build());

            // Add to default channel
            List<Channel> channels = channelRepository.findByWorkspaceId(workspaceId);
            for (Channel channel : channels) {
                if (channel.isDefault()) {
                    channel.getMembers().add(currentUser);
                    channelRepository.save(channel);
                }
            }
        }

        notification.setRead(true);
        notificationRepository.save(notification);
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
