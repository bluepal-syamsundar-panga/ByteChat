package com.bytechat.serviceimpl;

import com.bytechat.dto.response.ChannelResponse;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.dto.response.UserResponse;
import com.bytechat.entity.*;
import com.bytechat.repository.*;
import com.bytechat.services.ChannelService;
import com.bytechat.services.NotificationService;
import com.bytechat.exception.ResourceNotFoundException;
import com.bytechat.services.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChannelServiceImpl implements ChannelService {

    private final ChannelRepository channelRepository;
    private final WorkspaceRepository workspaceRepository;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final MessageRepository messageRepository;
    private final ChannelMemberRepository channelMemberRepository;
    private final EmailService emailService;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public ChannelResponse createChannel(Long workspaceId, String name, String description, boolean isPrivate, boolean isDefault, User creator) {
        log.info("Creating channel {} in workspace {} by user {}", name, workspaceId, creator != null ? creator.getEmail() : "SYSTEM");
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        
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
                    .orElseThrow(() -> new ResourceNotFoundException("Creator not found"));
            ChannelMember membership = ChannelMember.builder()
                    .channel(savedChannel)
                    .user(managedCreator)
                    .role(ChannelRole.ADMIN)
                    .build();
            channelMemberRepository.save(membership);
            log.info("Creator {} added as ADMIN to channel {}", creator.getEmail(), savedChannel.getName());
        }
        
        return mapToResponse(savedChannel, creator);
    }

    @Override
    public List<ChannelResponse> getWorkspaceChannels(Long workspaceId, User currentUser) {
        log.info("Fetching visible channels for workspace {} for user {}", workspaceId, currentUser.getEmail());
        if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, currentUser.getId())) {
            throw new com.bytechat.exception.UnauthorizedException("User is not a member of this workspace");
        }
        return channelRepository.findVisibleChannels(workspaceId, currentUser.getId()).stream()
                .map(channel -> mapToResponse(channel, currentUser))
                .collect(Collectors.toList());
    }

    @Override
    public List<ChannelResponse> getArchivedChannels(Long workspaceId, User currentUser) {
        log.info("Fetching archived channels for workspace {} for user {}", workspaceId, currentUser.getEmail());
        return channelRepository.findArchivedChannels(workspaceId, currentUser.getId()).stream()
                .map(channel -> mapToResponse(channel, currentUser))
                .collect(Collectors.toList());
    }

    @Override
    public List<ChannelResponse> getDeletedChannels(Long workspaceId, User currentUser) {
        log.info("Fetching deleted channels for workspace {} for user {}", workspaceId, currentUser.getEmail());
        return channelRepository.findDeletedChannels(workspaceId, currentUser.getId()).stream()
                .map(channel -> mapToResponse(channel, currentUser))
                .collect(Collectors.toList());
    }

    @Override
    public Channel getChannel(Long channelId) {
        return channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found with ID: " + channelId));
    }

    @Override
    @Transactional
    public void addMember(Long channelId, User user) {
        log.info("Adding member {} to channel {}", user.getEmail(), channelId);
        Channel channel = getChannel(channelId);
        
        User managedUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
        if (!channelMemberRepository.existsByChannelIdAndUserId(channelId, user.getId())) {
            ChannelMember membership = ChannelMember.builder()
                    .channel(channel)
                    .user(managedUser)
                    .role(ChannelRole.MEMBER)
                    .build();
            channelMemberRepository.save(membership);
            log.info("User {} successfully added to channel {}", user.getEmail(), channel.getName());
            publishSystemMessageAfterCommit(channel.getId(), managedUser.getId(), managedUser.getDisplayName() + " joined #" + channel.getName());
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
            log.info("User {} also added as member to workspace {}", user.getEmail(), workspace.getName());
        }
    }

    @Override
    public List<UserResponse> getChannelMembers(Long channelId) {
        log.info("Fetching members for channel {}", channelId);
        Channel channel = getChannel(channelId);
        if (isWorkspaceWideDefaultChannel(channel)) {
            syncDefaultChannelMemberships(channel);
            return workspaceMemberRepository.findByWorkspaceId(channel.getWorkspace().getId()).stream()
                    .map(WorkspaceMember::getUser)
                    .map(user -> {
                        UserResponse response = mapToUserResponse(user);
                        ChannelMember membership = channelMemberRepository.findByChannelIdAndUserId(channelId, user.getId()).orElse(null);
                        if (membership != null) {
                            response.setRole(membership.getRole().name());
                        } else {
                            response.setRole(channel.getCreatedBy() != null && channel.getCreatedBy().getId().equals(user.getId())
                                    ? ChannelRole.ADMIN.name()
                                    : ChannelRole.MEMBER.name());
                        }
                        return response;
                    })
                    .collect(Collectors.toList());
        }
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
        log.info("Inviting user {} to channel {} by user {}", email, channelId, currentUser.getEmail());
        Channel channel = getChannel(channelId);
        
        User invitedUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (channelMemberRepository.existsByChannelIdAndUserId(channelId, invitedUser.getId())) {
            log.warn("Invite failed: User {} is already a member of channel {}", email, channelId);
            throw new IllegalArgumentException("User is already a member of this channel");
        }

        notificationService.sendNotification(
                invitedUser.getId(),
                "CHANNEL_INVITE",
                currentUser.getDisplayName() + " invited you to join #" + channel.getName(),
                channelId
        );

        // Send invitation email
        try {
            emailService.sendInvitation(email, currentUser.getDisplayName(), channel.getName(), channel.getWorkspace().getName(), "CHANNEL");
            log.info("Invitation email sent to {} for channel {}", email, channel.getName());
        } catch (Exception e) {
            log.error("Failed to send channel invitation email to {}: {}", email, e.getMessage());
        }
    }

    @Override
    @Transactional
    public void acceptInvite(Long notificationId, User currentUser) {
        log.info("User {} accepting channel invite from notification {}", currentUser.getEmail(), notificationId);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!notification.getRecipient().getId().equals(currentUser.getId())) {
             log.warn("Invite accept failed: Notification {} does not belong to user {}", notificationId, currentUser.getEmail());
            throw new com.bytechat.exception.UnauthorizedException("Cannot accept another user's invite");
        }

        if (!"CHANNEL_INVITE".equals(notification.getType())) {
            log.warn("Invite accept failed: Notification {} is not a channel invite", notificationId);
            throw new RuntimeException("Notification is not a channel invite");
        }

        Long channelId = notification.getRelatedEntityId();
        if (channelId == null) {
            log.error("Invite accept failed: Notification {} missing channel ID", notificationId);
            throw new RuntimeException("Invite notification is missing channel information");
        }

        addMember(channelId, currentUser);

        notification.setRead(true);
        notificationRepository.save(notification);
        log.info("User {} successfully joined channel ID {}", currentUser.getEmail(), channelId);
    }

    @Override
    @Transactional
    public void archiveChannel(Long channelId, User currentUser) {
        log.info("Archiving channel {} for user {}", channelId, currentUser.getEmail());
        ChannelMember membership = channelMemberRepository.findByChannelIdAndUserId(channelId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("You are not a member of this channel"));
        
        membership.setArchived(true);
        channelMemberRepository.save(membership);
        log.info("Channel {} archived for user {}", channelId, currentUser.getEmail());
    }

    @Override
    @Transactional
    public void leaveChannel(Long channelId, User currentUser) {
        log.info("User {} leaving channel {}", currentUser.getEmail(), channelId);
        Channel channel = getChannel(channelId);
        if (channel.isDefault()) {
            log.warn("Leave failed: User {} tried to leave default channel {}", currentUser.getEmail(), channel.getName());
            throw new RuntimeException("Cannot leave the default channel");
        }
        
        ChannelMember membership = channelMemberRepository.findByChannelIdAndUserId(channelId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found"));

        if (ChannelRole.ADMIN.equals(membership.getRole())) {
             // Check if there are other admins
             long adminCount = channelMemberRepository.findByChannelId(channelId).stream()
                     .filter(cm -> ChannelRole.ADMIN.equals(cm.getRole()))
                     .count();
             
             if (adminCount <= 1 && channelMemberRepository.findByChannelId(channelId).size() > 1) {
                 log.warn("Leave failed: User {} is the only admin in channel {}", currentUser.getEmail(), channelId);
                 throw new RuntimeException("As the only Admin, you must transfer your role to another member before leaving.");
             }
        }

        // Keep the owning entity collection in sync so orphan removal and
        // subsequent membership-based queries reflect the leave immediately.
        channel.getMemberships().remove(membership);
        channelMemberRepository.delete(membership);
        log.info("User {} successfully left channel {}", currentUser.getEmail(), channel.getName());
        publishSystemMessageAfterCommit(channel.getId(), currentUser.getId(), currentUser.getDisplayName() + " left #" + channel.getName());
    }

    @Override
    @Transactional
    public void deleteChannel(Long channelId, User currentUser) {
        log.info("Deleting channel {} by user {}", channelId, currentUser.getEmail());
        Channel channel = getChannel(channelId);
        
        // Only workspace owner or channel creator can delete
        boolean isOwner = workspaceMemberRepository.findByWorkspaceIdAndUserId(channel.getWorkspace().getId(), currentUser.getId())
                .map(m -> WorkspaceRole.OWNER.equals(m.getRole()))
                .orElse(false);
        boolean isCreator = channel.getCreatedBy().getId().equals(currentUser.getId());

        if (!isOwner && !isCreator) {
            log.warn("Delete failed: User {} has no permission to delete channel {}", currentUser.getEmail(), channelId);
            throw new com.bytechat.exception.UnauthorizedException("Only workspace owner or channel creator can delete this channel");
        }

        if (channel.isDefault()) {
            log.warn("Delete failed: Cannot delete default channel {}", channel.getName());
            throw new RuntimeException("Cannot delete the default channel");
        }

        // Soft delete
        channel.setDeleted(true);
        channelRepository.save(channel);
        log.info("Channel {} soft-deleted", channel.getName());
    }

    @Override
    @Transactional
    public void permanentlyDeleteChannel(Long channelId, User currentUser) {
        log.info("Permanently deleting channel {} by user {}", channelId, currentUser.getEmail());
        Channel channel = getChannel(channelId);
        
        // Workspace Owner or Channel ADMIN (if they are the creator) can permanently delete
        boolean isWorkspaceOwner = workspaceMemberRepository.findByWorkspaceIdAndUserId(channel.getWorkspace().getId(), currentUser.getId())
                .map(m -> WorkspaceRole.OWNER.equals(m.getRole()))
                .orElse(false);
        boolean isCreator = channel.getCreatedBy().getId().equals(currentUser.getId());

        if (!isWorkspaceOwner && !isCreator) {
            log.warn("Permanent delete failed: User {} has no permission for channel {}", currentUser.getEmail(), channelId);
            throw new com.bytechat.exception.UnauthorizedException("Only the workspace owner or channel creator can permanently delete this channel.");
        }

        if (!channel.isDeleted()) {
            log.warn("Permanent delete failed: Channel {} must be in trash first", channelId);
            throw new RuntimeException("Channel must be moved to trash before permanent deletion.");
        }

        channelRepository.delete(channel);
        log.info("Channel {} permanently deleted", channelId);
    }

    @Override
    @Transactional
    public void removeMember(Long channelId, Long userId, User currentUser) {
        log.info("Removing member {} from channel {} by admin {}", userId, channelId, currentUser.getEmail());
        Channel channel = getChannel(channelId);
        
        // Permission check: Channel ADMIN or Workspace OWNER
        boolean isWorkspaceOwner = workspaceMemberRepository.findByWorkspaceIdAndUserId(channel.getWorkspace().getId(), currentUser.getId())
                .map(m -> WorkspaceRole.OWNER.equals(m.getRole()))
                .orElse(false);
        
        ChannelMember adminMember = channelMemberRepository.findByChannelIdAndUserId(channelId, currentUser.getId())
                .orElse(null);
        boolean isChannelAdmin = adminMember != null && ChannelRole.ADMIN.equals(adminMember.getRole());

        if (!isWorkspaceOwner && !isChannelAdmin) {
            log.warn("Remove member failed: User {} has no admin permission in channel {}", currentUser.getEmail(), channelId);
            throw new com.bytechat.exception.UnauthorizedException("Permission denied. Only admins or the workspace owner can remove members.");
        }

        User userToRemove = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User to remove not found"));

        if (channel.isDefault() && isWorkspaceOwner) {
            log.info("Removing user {} from workspace {} because they were removed from default channel", userToRemove.getEmail(), channel.getWorkspace().getName());
            removeUserFromWorkspaceInternally(channel.getWorkspace().getId(), userToRemove);
            return;
        }

        ChannelMember membership = channelMemberRepository.findByChannelIdAndUserId(channelId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("User is not a member of this channel"));

        // Remove from the channel's membership set to ensure orphanRemoval works correctly
        channel.getMemberships().remove(membership);
        channelMemberRepository.delete(membership);
        log.info("Member {} removed from channel {}", userToRemove.getEmail(), channel.getName());
        publishSystemMessageAfterCommit(channel.getId(), currentUser.getId(), userToRemove.getDisplayName() + " was removed from #" + channel.getName());
    }

    /**
     * Helper to replicate workspace removal logic without circular dependency.
     */
    private void removeUserFromWorkspaceInternally(Long workspaceId, User user) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
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
                         log.info("Transferred Channel ADMIN to Workspace Owner for channel {}", cm.getChannel().getName());
                    } else {
                        channelMemberRepository.findByChannelIdAndUserId(cm.getChannel().getId(), owner.getId()).ifPresent(ownerCm -> {
                            ownerCm.setRole(ChannelRole.ADMIN);
                            channelMemberRepository.save(ownerCm);
                            log.info("Promoted Workspace Owner to Channel ADMIN for channel {}", cm.getChannel().getName());
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
        log.info("Restoring channel {} for user {}", channelId, currentUser.getEmail());
        Channel channel = getChannel(channelId);
        
        // 1. Un-archive for the current user if they are a member
        channelMemberRepository.findByChannelIdAndUserId(channelId, currentUser.getId())
                .ifPresent(membership -> {
                    membership.setArchived(false);
                    channelMemberRepository.save(membership);
                    log.info("Channel {} un-archived for user {}", channel.getName(), currentUser.getEmail());
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
                log.info("Channel {} globally restored from trash", channel.getName());
            } else {
                log.warn("Restore failed: User {} has no permission to restore channel {}", currentUser.getEmail(), channelId);
            }
        }
    }

    @Override
    @Transactional
    public void transferOwnership(Long channelId, Long newOwnerId, User currentUser) {
        log.info("Transferring channel {} ownership to {} by user {}", channelId, newOwnerId, currentUser.getEmail());
        ChannelMember currentAdmin = channelMemberRepository.findByChannelIdAndUserId(channelId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("You are not a member of this channel"));
        
        if (!ChannelRole.ADMIN.equals(currentAdmin.getRole())) {
            log.warn("Transfer failed: User {} is not a channel admin", currentUser.getEmail());
            throw new RuntimeException("Only a Channel Admin can transfer their role.");
        }

        ChannelMember newAdmin = channelMemberRepository.findByChannelIdAndUserId(channelId, newOwnerId)
                .orElseThrow(() -> new ResourceNotFoundException("New admin must be a member of the channel"));
        
        currentAdmin.setRole(ChannelRole.MEMBER);
        channelMemberRepository.save(currentAdmin);
        newAdmin.setRole(ChannelRole.ADMIN);
        channelMemberRepository.save(newAdmin);
        log.info("Channel {} ADMIN role transferred to user ID {}", channelId, newOwnerId);
        publishSystemMessageAfterCommit(
                channelId,
                currentUser.getId(),
                currentUser.getDisplayName() + " transferred channel admin to " + newAdmin.getUser().getDisplayName() + " in #" + getChannel(channelId).getName()
        );
    }

    @Override
    @Transactional
    public void makeAdmin(Long channelId, Long userId, User currentUser) {
        log.info("Promoting user {} to admin in channel {} by user {}", userId, channelId, currentUser.getEmail());
        Channel channel = getChannel(channelId);

        boolean isWorkspaceOwner = workspaceMemberRepository.findByWorkspaceIdAndUserId(channel.getWorkspace().getId(), currentUser.getId())
                .map(m -> WorkspaceRole.OWNER.equals(m.getRole()))
                .orElse(false);

        ChannelMember actingMember = channelMemberRepository.findByChannelIdAndUserId(channelId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("You are not a member of this channel"));

        if (!isWorkspaceOwner && !ChannelRole.ADMIN.equals(actingMember.getRole())) {
            throw new com.bytechat.exception.UnauthorizedException("Only admins or the workspace owner can make another member an admin.");
        }

        ChannelMember targetMember = channelMemberRepository.findByChannelIdAndUserId(channelId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("User is not a member of this channel"));

        if (ChannelRole.ADMIN.equals(targetMember.getRole())) {
            throw new RuntimeException("This member is already an admin.");
        }

        targetMember.setRole(ChannelRole.ADMIN);
        channelMemberRepository.save(targetMember);
        publishSystemMessageAfterCommit(
                channelId,
                currentUser.getId(),
                currentUser.getDisplayName() + " made " + targetMember.getUser().getDisplayName() + " an admin in #" + channel.getName()
        );
    }

    @Override
    @Transactional
    public void removeAdmin(Long channelId, Long userId, User currentUser) {
        log.info("Demoting user {} from admin in channel {} by user {}", userId, channelId, currentUser.getEmail());
        Channel channel = getChannel(channelId);

        boolean isWorkspaceOwner = workspaceMemberRepository.findByWorkspaceIdAndUserId(channel.getWorkspace().getId(), currentUser.getId())
                .map(m -> WorkspaceRole.OWNER.equals(m.getRole()))
                .orElse(false);

        ChannelMember actingMember = channelMemberRepository.findByChannelIdAndUserId(channelId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("You are not a member of this channel"));

        if (!isWorkspaceOwner && !ChannelRole.ADMIN.equals(actingMember.getRole())) {
            throw new com.bytechat.exception.UnauthorizedException("Only admins or the workspace owner can remove admin access.");
        }

        ChannelMember targetMember = channelMemberRepository.findByChannelIdAndUserId(channelId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("User is not a member of this channel"));

        if (!ChannelRole.ADMIN.equals(targetMember.getRole())) {
            throw new RuntimeException("This member is not an admin.");
        }

        long adminCount = channelMemberRepository.findByChannelId(channelId).stream()
                .filter(cm -> ChannelRole.ADMIN.equals(cm.getRole()))
                .count();

        if (adminCount <= 1) {
            throw new RuntimeException("Cannot remove the last admin from this channel.");
        }

        targetMember.setRole(ChannelRole.MEMBER);
        channelMemberRepository.save(targetMember);
        publishSystemMessageAfterCommit(
                channelId,
                currentUser.getId(),
                currentUser.getDisplayName() + " removed admin access from " + targetMember.getUser().getDisplayName() + " in #" + channel.getName()
        );
    }

    private MessageResponse createSystemMessage(Channel channel, User actor, String content) {
        Message message = Message.builder()
                .channel(channel)
                .sender(actor)
                .content(content)
                .type("SYSTEM")
                .mentionedUserIds(new ArrayList<>())
                .build();
        Message saved = messageRepository.saveAndFlush(message);
        return MessageResponse.builder()
                .id(saved.getId())
                .roomId(channel.getWorkspace() != null ? channel.getWorkspace().getId() : null)
                .channelId(channel.getId())
                .senderId(actor.getId())
                .senderName(actor.getDisplayName())
                .senderAvatar(actor.getAvatarUrl())
                .content(saved.getContent())
                .type(saved.getType())
                .isDeleted(false)
                .isPinned(false)
                .mentionedUserIds(saved.getMentionedUserIds())
                .reactions(Collections.emptyList())
                .sentAt(saved.getSentAt())
                .build();
    }

    private void publishSystemMessageAfterCommit(Long channelId, Long actorId, String content) {
        Channel channel = getChannel(channelId);
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        MessageResponse response = createSystemMessage(channel, actor, content);

        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            messagingTemplate.convertAndSend("/topic/channel/" + channel.getId(), response);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                messagingTemplate.convertAndSend("/topic/channel/" + channelId, response);
            }
        });
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
                .memberCount(isWorkspaceWideDefaultChannel(channel)
                        ? workspaceMemberRepository.findByWorkspaceId(channel.getWorkspace().getId()).size()
                        : channelMemberRepository.findByChannelId(channel.getId()).size())
                .createdBy(channel.getCreatedBy() != null ? mapToUserResponse(channel.getCreatedBy()) : null)
                .role(role)
                .build();
        
        if (currentUser != null) {
            response.setUnreadCount((int) messageRepository.countUnreadInChannel(channel.getId(), currentUser.getId()));
        }
        
        return response;
    }

    private void syncDefaultChannelMemberships(Channel channel) {
        if (channel.getWorkspace() == null) {
            return;
        }

        List<WorkspaceMember> workspaceMembers = workspaceMemberRepository.findByWorkspaceId(channel.getWorkspace().getId());
        for (WorkspaceMember workspaceMember : workspaceMembers) {
            Long userId = workspaceMember.getUser().getId();
            if (!channelMemberRepository.existsByChannelIdAndUserId(channel.getId(), userId)) {
                ChannelRole role = WorkspaceRole.OWNER.equals(workspaceMember.getRole()) ? ChannelRole.ADMIN : ChannelRole.MEMBER;
                ChannelMember membership = ChannelMember.builder()
                        .channel(channel)
                        .user(workspaceMember.getUser())
                        .role(role)
                        .build();
                channelMemberRepository.save(membership);
                log.info("Synced workspace member {} into default channel {}", workspaceMember.getUser().getEmail(), channel.getName());
            }
        }
    }

    private boolean isWorkspaceWideDefaultChannel(Channel channel) {
        return channel != null && (channel.isDefault() || "general".equalsIgnoreCase(channel.getName()));
    }
}
