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

import java.util.ArrayList;
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

    @Override
    @Transactional
    public ChannelResponse createChannel(Long workspaceId, String name, String description, boolean isDefault, User creator) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new RuntimeException("Workspace not found"));
        
        Channel channel = Channel.builder()
                .name(name)
                .description(description)
                .workspace(workspace)
                .isDefault(isDefault)
                .createdBy(creator)
                .build();
        
        // Add creator to channel
        if (creator != null) {
            channel.getMembers().add(creator);
        }
        
        // Add all workspace members to the new channel IF it's the default one
        // Note: The user request says "if user create workspace then one default channel will create if user add any user into that workspace that person will also member of that default channel"
        // This implies for OTHER channels, the owner adds members manually.
        
        return mapToResponse(channelRepository.save(channel));
    }

    @Override
    public List<ChannelResponse> getWorkspaceChannels(Long workspaceId) {
        return channelRepository.findByWorkspaceId(workspaceId).stream()
                .map(this::mapToResponse)
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
        channel.getMembers().add(user);
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

    private ChannelResponse mapToResponse(Channel channel) {
        return ChannelResponse.builder()
                .id(channel.getId())
                .name(channel.getName())
                .description(channel.getDescription())
                .workspaceId(channel.getWorkspace() != null ? channel.getWorkspace().getId() : null)
                .isPrivate(channel.isPrivate())
                .isArchived(channel.isArchived())
                .createdAt(channel.getCreatedAt())
                .memberCount(channel.getMembers() != null ? channel.getMembers().size() : 0)
                .build();
    }
}
