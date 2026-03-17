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
        
        // Add creator as member - fetch managed entity to be safe
        if (creator != null) {
            User managedCreator = userRepository.findById(creator.getId())
                    .orElseThrow(() -> new RuntimeException("Creator not found"));
            channel.getMembers().add(managedCreator);
        }
        
        Channel savedChannel = channelRepository.save(channel);
        return mapToResponse(savedChannel);
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
                
        channel.getMembers().add(managedUser);
        channelRepository.save(channel);

        // Ensure membership in the parent workspace
        Workspace workspace = channel.getWorkspace();
        if (workspace != null && !workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspace.getId(), user.getId())) {
            WorkspaceMember member = WorkspaceMember.builder()
                    .workspace(workspace)
                    .user(user)
                    .role(WorkspaceRole.MEMBER)
                    .build();
            workspaceMemberRepository.save(member);
        }
    }

    @Override
    public List<UserResponse> getChannelMembers(Long channelId) {
        Channel channel = getChannel(channelId);
        return channel.getMembers().stream()
                .map(this::mapToUserResponse)
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

        if (channel.getMembers().contains(invitedUser)) {
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
        Channel channel = getChannel(channelId);
        
        // Only workspace owner or channel creator can archive
        boolean isOwner = workspaceMemberRepository.findByWorkspaceIdAndUserId(channel.getWorkspace().getId(), currentUser.getId())
                .map(m -> WorkspaceRole.OWNER.equals(m.getRole()))
                .orElse(false);
        boolean isCreator = channel.getCreatedBy().getId().equals(currentUser.getId());

        if (!isOwner && !isCreator) {
            throw new RuntimeException("Only workspace owner or channel creator can archive this channel");
        }

        channel.setArchived(true);
        channelRepository.save(channel);
    }

    @Override
    @Transactional
    public void leaveChannel(Long channelId, User currentUser) {
        Channel channel = getChannel(channelId);
        if (channel.isDefault()) {
            throw new RuntimeException("Cannot leave the default channel");
        }
        
        if (channel.getCreatedBy().getId().equals(currentUser.getId())) {
             // If creator leaves, they MUST transfer ownership first or if they are the only member, maybe delete?
             // The user requested: "if creator want to leave, owner give ownership to another member"
             if (channel.getMembers().size() > 1) {
                 throw new RuntimeException("As the creator, you must transfer ownership to another member before leaving.");
             }
        }

        User managedUser = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        channel.getMembers().remove(managedUser);
        channelRepository.save(channel);
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
        
        // ONLY the creator can permanently delete from Trash
        if (!channel.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only the channel creator can permanently delete this channel.");
        }

        if (!channel.isDeleted()) {
            throw new RuntimeException("Channel must be in trash followed by soft-delete before permanent deletion.");
        }

        channelRepository.delete(channel);
    }

    @Override
    @Transactional
    public void restoreChannel(Long channelId, User currentUser) {
        Channel channel = getChannel(channelId);
        
        // Only workspace owner or channel creator can restore
        boolean isOwner = workspaceMemberRepository.findByWorkspaceIdAndUserId(channel.getWorkspace().getId(), currentUser.getId())
                .map(m -> WorkspaceRole.OWNER.equals(m.getRole()))
                .orElse(false);
        boolean isCreator = channel.getCreatedBy().getId().equals(currentUser.getId());

        if (!isOwner && !isCreator) {
            throw new RuntimeException("Only workspace owner or channel creator can restore this channel");
        }

        channel.setDeleted(false);
        channel.setArchived(false); // Restoring also un-archives for convenience
        channelRepository.save(channel);
    }

    @Override
    @Transactional
    public void transferOwnership(Long channelId, Long newOwnerId, User currentUser) {
        Channel channel = getChannel(channelId);
        
        if (!channel.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only the current channel creator can transfer ownership.");
        }

        User newOwner = userRepository.findById(newOwnerId)
                .orElseThrow(() -> new RuntimeException("New owner user not found"));
        
        // Ensure new owner is a member
        if (!channel.getMembers().contains(newOwner)) {
            channel.getMembers().add(newOwner);
        }

        channel.setCreatedBy(newOwner);
        channelRepository.save(channel);
    }

    private ChannelResponse mapToResponse(Channel channel) {
        return mapToResponse(channel, null);
    }

    private ChannelResponse mapToResponse(Channel channel, User currentUser) {
        ChannelResponse response = ChannelResponse.builder()
                .id(channel.getId())
                .name(channel.getName())
                .description(channel.getDescription())
                .workspaceId(channel.getWorkspace() != null ? channel.getWorkspace().getId() : null)
                .isPrivate(channel.isPrivate())
                .isArchived(channel.isArchived())
                .isDeleted(channel.isDeleted())
                .createdAt(channel.getCreatedAt())
                .memberCount(channel.getMembers() != null ? channel.getMembers().size() : 0)
                .createdBy(channel.getCreatedBy() != null ? mapToUserResponse(channel.getCreatedBy()) : null)
                .build();
        
        if (currentUser != null) {
            response.setUnreadCount((int) messageRepository.countUnreadInChannel(channel.getId(), currentUser.getId()));
        }
        
        return response;
    }
}
