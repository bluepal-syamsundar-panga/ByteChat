package com.bytechat.serviceimpl;

import com.bytechat.dto.response.ChannelResponse;
import com.bytechat.dto.response.UserResponse;
import com.bytechat.entity.*;
import com.bytechat.repository.*;
import com.bytechat.services.ChannelService;
import com.bytechat.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChannelServiceImpl implements ChannelService {

    private final ChannelRepository channelRepository;
    private final WorkspaceRepository workspaceRepository;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final MessageRepository messageRepository;
    private final ChannelMemberRepository channelMemberRepository;

    @Override
    @Transactional
    public ChannelResponse createChannel(Long workspaceId, String name, String description, boolean isPrivate, boolean isDefault, User creator) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new RuntimeException("Workspace not found"));
        
        Channel channel = Channel.builder()
                .name(name)
                .description(description)
                .workspace(workspace)
                .isPrivate(isPrivate)
                .isDefault(isDefault)
                .createdBy(creator)
                .build();
        
        Channel savedChannel = channelRepository.save(channel);
        
        // Add creator as ADMIN in ChannelMember
        if (creator != null) {
            User managedCreator = userRepository.findById(creator.getId())
                    .orElseThrow(() -> new RuntimeException("Creator not found"));
            ChannelMember membership = ChannelMember.builder()
                    .channel(savedChannel)
                    .user(managedCreator)
                    .role(ChannelRole.ADMIN)
                    .build();
            channelMemberRepository.save(membership);
        }
        
        return mapToResponse(savedChannel, creator);
    }

    @Override
    public List<ChannelResponse> getWorkspaceChannels(Long workspaceId, User currentUser) {
        return channelRepository.findVisibleChannels(workspaceId, currentUser.getId()).stream()
                .map(channel -> mapToResponse(channel, currentUser))
                .collect(Collectors.toList());
    }

    @Override
    public List<ChannelResponse> getArchivedChannels(Long workspaceId, User currentUser) {
        return channelRepository.findArchivedChannels(workspaceId, currentUser.getId()).stream()
                .map(channel -> mapToResponse(channel, currentUser))
                .collect(Collectors.toList());
    }

    @Override
    public List<ChannelResponse> getDeletedChannels(Long workspaceId, User currentUser) {
        return channelRepository.findDeletedChannels(workspaceId, currentUser.getId()).stream()
                .map(channel -> mapToResponse(channel, currentUser))
                .collect(Collectors.toList());
    }

    @Override
    public Channel getChannel(Long channelId) {
        return channelRepository.findById(channelId)
                .orElseThrow(() -> new RuntimeException("Channel not found"));
    }

    @Override
    @Transactional
    public void addMember(Long channelId, User user) {
        Channel channel = getChannel(channelId);
        
        User managedUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        if (!channelMemberRepository.existsByChannelIdAndUserId(channelId, user.getId())) {
            ChannelMember membership = ChannelMember.builder()
                    .channel(channel)
                    .user(managedUser)
                    .role(ChannelRole.MEMBER)
                    .build();
            channelMemberRepository.save(membership);
        }

        // Ensure membership in the parent workspace
        Workspace workspace = channel.getWorkspace();
        if (workspace != null && !workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspace.getId(), user.getId())) {
            WorkspaceMember member = WorkspaceMember.builder()
                    .workspace(workspace)
                    .user(managedUser)
                    .role(WorkspaceRole.MEMBER)
                    .build();
            workspaceMemberRepository.save(member);
        }
    }

    @Override
    public List<UserResponse> getChannelMembers(Long channelId) {
        return channelMemberRepository.findByChannelId(channelId).stream()
                .map(cm -> {
                    UserResponse resp = mapToUserResponse(cm.getUser());
                    resp.setRole(cm.getRole().name()); // Channel-level role
                    return resp;
                })
                .collect(Collectors.toList());
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .online(user.isOnline())
                .role(user.getRole() != null ? user.getRole().name() : "MEMBER")
                .build();
    }

    @Override
    @Transactional
    public void inviteUser(Long channelId, String email, User currentUser) {
        Channel channel = getChannel(channelId);
        
        User invitedUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));

        if (channelMemberRepository.existsByChannelIdAndUserId(channelId, invitedUser.getId())) {
            throw new IllegalArgumentException("User is already a member of this channel");
        }

        notificationService.sendNotification(
                invitedUser.getId(),
                "CHANNEL_INVITE",
                currentUser.getDisplayName() + " invited you to join #" + channel.getName(),
                channelId
        );
    }

    @Override
    @Transactional
    public void acceptInvite(Long notificationId, User currentUser) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getRecipient().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Cannot accept another user's invite");
        }

        if (!"CHANNEL_INVITE".equals(notification.getType())) {
            throw new RuntimeException("Notification is not a channel invite");
        }

        Long channelId = notification.getRelatedEntityId();
        if (channelId == null) {
            throw new RuntimeException("Invite notification is missing channel information");
        }

        addMember(channelId, currentUser);

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void archiveChannel(Long channelId, User currentUser) {
        ChannelMember membership = channelMemberRepository.findByChannelIdAndUserId(channelId, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("You are not a member of this channel"));
        
        membership.setArchived(true);
        channelMemberRepository.save(membership);
    }

    @Override
    @Transactional
    public void leaveChannel(Long channelId, User currentUser) {
        Channel channel = getChannel(channelId);
        if (channel.isDefault()) {
            throw new RuntimeException("Cannot leave the default channel");
        }
        
        ChannelMember membership = channelMemberRepository.findByChannelIdAndUserId(channelId, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Membership not found"));

        if (ChannelRole.ADMIN.equals(membership.getRole())) {
             // Check if there are other admins
             long adminCount = channelMemberRepository.findByChannelId(channelId).stream()
                     .filter(cm -> ChannelRole.ADMIN.equals(cm.getRole()))
                     .count();
             
             if (adminCount <= 1 && channelMemberRepository.findByChannelId(channelId).size() > 1) {
                 throw new RuntimeException("As the only Admin, you must transfer your role to another member before leaving.");
             }
        }

        channelMemberRepository.delete(membership);
    }

    @Override
    @Transactional
    public void deleteChannel(Long channelId, User currentUser) {
        Channel channel = getChannel(channelId);
        
        // Only workspace owner or channel creator can delete
        boolean isOwner = workspaceMemberRepository.findByWorkspaceIdAndUserId(channel.getWorkspace().getId(), currentUser.getId())
                .map(m -> WorkspaceRole.OWNER.equals(m.getRole()))
                .orElse(false);
        boolean isCreator = channel.getCreatedBy().getId().equals(currentUser.getId());

        if (!isOwner && !isCreator) {
            throw new RuntimeException("Only workspace owner or channel creator can delete this channel");
        }

        if (channel.isDefault()) {
            throw new RuntimeException("Cannot delete the default channel");
        }

        // Soft delete
        channel.setDeleted(true);
        channelRepository.save(channel);
    }

    @Override
    @Transactional
    public void permanentlyDeleteChannel(Long channelId, User currentUser) {
        Channel channel = getChannel(channelId);
        
        // Workspace Owner or Channel ADMIN (if they are the creator) can permanently delete
        boolean isWorkspaceOwner = workspaceMemberRepository.findByWorkspaceIdAndUserId(channel.getWorkspace().getId(), currentUser.getId())
                .map(m -> WorkspaceRole.OWNER.equals(m.getRole()))
                .orElse(false);
        boolean isCreator = channel.getCreatedBy().getId().equals(currentUser.getId());

        if (!isWorkspaceOwner && !isCreator) {
            throw new RuntimeException("Only the workspace owner or channel creator can permanently delete this channel.");
        }

        if (!channel.isDeleted()) {
            throw new RuntimeException("Channel must be moved to trash before permanent deletion.");
        }

        channelRepository.delete(channel);
    }

    @Override
    @Transactional
    public void removeMember(Long channelId, Long userId, User currentUser) {
        Channel channel = getChannel(channelId);
        
        // Permission check: Channel ADMIN or Workspace OWNER
        boolean isWorkspaceOwner = workspaceMemberRepository.findByWorkspaceIdAndUserId(channel.getWorkspace().getId(), currentUser.getId())
                .map(m -> WorkspaceRole.OWNER.equals(m.getRole()))
                .orElse(false);
        
        ChannelMember adminMember = channelMemberRepository.findByChannelIdAndUserId(channelId, currentUser.getId())
                .orElse(null);
        boolean isChannelAdmin = adminMember != null && ChannelRole.ADMIN.equals(adminMember.getRole());

        if (!isWorkspaceOwner && !isChannelAdmin) {
            throw new RuntimeException("Permission denied. Only admins or the workspace owner can remove members.");
        }

        User userToRemove = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User to remove not found"));

        if (channel.isDefault() && isWorkspaceOwner) {
            // CRITICAL LOGIC: If removed from default channel by Workspace Owner, remove from EVERYTHING
            // Since there's no WorkspaceService injection here to avoid circular dependency (usually), 
            // we should handle it carefully. Actually, ChannelServiceImpl already has workspaceRepositories.
            
            // We can't easily call workspaceService.removeMember due to circular.
            // But we have the logic in workspaceServiceImpl. Let's see if we can trigger it.
            // For now, I'll implement the internal removal here or assume the controller handles it?
            // User requested: "If Owner removes a user from a default channel: => That user is removed from the entire workspace."
            
            // I'll manually replicate the workspace removal logic to avoid circular deps if needed, 
            // or better, I should probably have added this to WorkspaceService initially.
            // Let's implement it here directly using the repositories we have.
            
            removeUserFromWorkspaceInternally(channel.getWorkspace().getId(), userToRemove);
            return;
        }

        ChannelMember membership = channelMemberRepository.findByChannelIdAndUserId(channelId, userId)
                .orElseThrow(() -> new RuntimeException("User is not a member of this channel"));

        // Remove from the channel's membership set to ensure orphanRemoval works correctly
        channel.getMemberships().remove(membership);
        channelMemberRepository.delete(membership);
    }

    /**
     * Helper to replicate workspace removal logic without circular dependency.
     */
    private void removeUserFromWorkspaceInternally(Long workspaceId, User user) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new RuntimeException("Workspace not found"));
        User owner = workspace.getOwner();

        // 1. Reassign Admin roles
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
                    } else {
                        channelMemberRepository.findByChannelIdAndUserId(cm.getChannel().getId(), owner.getId()).ifPresent(ownerCm -> {
                            ownerCm.setRole(ChannelRole.ADMIN);
                            channelMemberRepository.save(ownerCm);
                        });
                    }
                }
            }
        }

        // 2. Remove from all channel memberships
        for (ChannelMember cm : memberships) {
            cm.getChannel().getMemberships().remove(cm);
            channelMemberRepository.delete(cm);
        }

        // 3. Remove from workspace
        workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, user.getId())
                .ifPresent(workspaceMemberRepository::delete);
    }

    @Override
    @Transactional
    public void restoreChannel(Long channelId, User currentUser) {
        Channel channel = getChannel(channelId);
        
        // 1. Un-archive for the current user if they are a member
        channelMemberRepository.findByChannelIdAndUserId(channelId, currentUser.getId())
                .ifPresent(membership -> {
                    membership.setArchived(false);
                    channelMemberRepository.save(membership);
                });

        // 2. Un-delete globally if the user has permission and it was deleted
        if (channel.isDeleted()) {
            boolean isOwner = workspaceMemberRepository.findByWorkspaceIdAndUserId(channel.getWorkspace().getId(), currentUser.getId())
                    .map(m -> WorkspaceRole.OWNER.equals(m.getRole()))
                    .orElse(false);
            boolean isCreator = channel.getCreatedBy().getId().equals(currentUser.getId());

            if (isOwner || isCreator) {
                channel.setDeleted(false);
                channelRepository.save(channel);
            }
        }
    }

    @Override
    @Transactional
    public void transferOwnership(Long channelId, Long newOwnerId, User currentUser) {
        ChannelMember currentAdmin = channelMemberRepository.findByChannelIdAndUserId(channelId, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("You are not a member of this channel"));
        
        if (!ChannelRole.ADMIN.equals(currentAdmin.getRole())) {
            throw new RuntimeException("Only a Channel Admin can transfer their role.");
        }

        ChannelMember newAdmin = channelMemberRepository.findByChannelIdAndUserId(channelId, newOwnerId)
                .orElseThrow(() -> new RuntimeException("New admin must be a member of the channel"));
        
        newAdmin.setRole(ChannelRole.ADMIN);
        channelMemberRepository.save(newAdmin);
        
        // Optionally downgrade current admin? Prompt didn't specify, but usually yes
        // currentAdmin.setRole(ChannelRole.MEMBER);
        // channelMemberRepository.save(currentAdmin);
    }


    private ChannelResponse mapToResponse(Channel channel, User currentUser) {
        String role = "MEMBER";
        boolean isArchived = false;
        if (currentUser != null) {
            ChannelMember membership = channelMemberRepository.findByChannelIdAndUserId(channel.getId(), currentUser.getId())
                    .orElse(null);
            if (membership != null) {
                isArchived = channel.isArchived() || membership.isArchived();
                role = membership.getRole().name();
            } else {
                isArchived = channel.isArchived();
            }
        }

        ChannelResponse response = ChannelResponse.builder()
                .id(channel.getId())
                .name(channel.getName())
                .description(channel.getDescription())
                .workspaceId(channel.getWorkspace() != null ? channel.getWorkspace().getId() : null)
                .isPrivate(channel.isPrivate())
                .isArchived(isArchived)
                .isDeleted(channel.isDeleted())
                .createdAt(channel.getCreatedAt())
                .memberCount(channelMemberRepository.findByChannelId(channel.getId()).size())
                .createdBy(channel.getCreatedBy() != null ? mapToUserResponse(channel.getCreatedBy()) : null)
                .role(role)
                .build();
        
        if (currentUser != null) {
            response.setUnreadCount((int) messageRepository.countUnreadInChannel(channel.getId(), currentUser.getId()));
        }
        
        return response;
    }
}
