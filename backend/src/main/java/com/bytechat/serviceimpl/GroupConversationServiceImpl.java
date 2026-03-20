package com.bytechat.serviceimpl;

import com.bytechat.dto.request.CreateGroupConversationRequest;
import com.bytechat.dto.request.GroupConversationInviteRequest;
import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.GroupConversationInviteResponse;
import com.bytechat.dto.response.GroupConversationResponse;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.dto.response.ReactionResponse;
import com.bytechat.dto.response.UserResponse;
import com.bytechat.entity.*;
import com.bytechat.exception.ResourceNotFoundException;
import com.bytechat.exception.UnauthorizedException;
import com.bytechat.repository.*;
import com.bytechat.services.GroupConversationService;
import com.bytechat.services.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GroupConversationServiceImpl implements GroupConversationService {
    private final GroupConversationRepository groupConversationRepository;
    private final GroupConversationMemberRepository groupConversationMemberRepository;
    private final GroupConversationInviteRepository groupConversationInviteRepository;
    private final GroupConversationMessageRepository groupConversationMessageRepository;
    private final GroupConversationMessageReadRepository groupConversationMessageReadRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ReactionRepository reactionRepository;

    @Override
    @Transactional
    public GroupConversationResponse createConversation(CreateGroupConversationRequest request, User currentUser) {
        Workspace workspace = workspaceRepository.findById(request.getWorkspaceId())
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspace.getId(), currentUser.getId())) {
            throw new UnauthorizedException("You are not a member of this workspace");
        }

        GroupConversation group = groupConversationRepository.save(GroupConversation.builder()
                .workspace(workspace)
                .name(request.getName().trim())
                .createdBy(currentUser)
                .build());

        groupConversationMemberRepository.save(GroupConversationMember.builder()
                .groupConversation(group)
                .user(currentUser)
                .build());

        Set<Long> memberIds = new LinkedHashSet<>(request.getMemberIds());
        memberIds.remove(currentUser.getId());

        for (Long memberId : memberIds) {
            if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspace.getId(), memberId)) {
                continue;
            }
            User invitee = userRepository.findById(memberId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + memberId));
            GroupConversationInvite invite = groupConversationInviteRepository.save(GroupConversationInvite.builder()
                    .groupConversation(group)
                    .inviter(currentUser)
                    .invitee(invitee)
                    .build());
            notificationService.sendNotification(
                    invitee.getId(),
                    "GROUP_DM_INVITE",
                    currentUser.getDisplayName() + " invited you to join group " + group.getName(),
                    invite.getId()
            );
        }

        return mapConversation(group, currentUser);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GroupConversationResponse> getUserGroups(User currentUser) {
        return groupConversationRepository.findAllForUser(currentUser.getId()).stream()
                .map(group -> mapConversation(group, currentUser))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public GroupConversationResponse getConversation(Long groupId, User currentUser) {
        GroupConversation group = getConversationOrThrow(groupId);
        ensureMember(groupId, currentUser.getId());
        return mapConversation(group, currentUser);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GroupConversationInviteResponse> getPendingInvites(User currentUser) {
        return groupConversationInviteRepository.findByInviteeIdAndStatus(currentUser.getId(), InvitationStatus.PENDING)
                .stream()
                .map(GroupConversationInviteResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public GroupConversationInviteResponse acceptInvite(Long inviteId, User currentUser) {
        GroupConversationInvite invite = getInviteOrThrow(inviteId);
        if (!invite.getInvitee().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Invite does not belong to current user");
        }
        invite.setStatus(InvitationStatus.ACCEPTED);
        invite.setRespondedAt(LocalDateTime.now());
        groupConversationInviteRepository.save(invite);

        if (!groupConversationMemberRepository.existsByGroupConversationIdAndUserId(invite.getGroupConversation().getId(), currentUser.getId())) {
            groupConversationMemberRepository.save(GroupConversationMember.builder()
                    .groupConversation(invite.getGroupConversation())
                    .user(currentUser)
                    .build());
        }
        createSystemMessage(invite.getGroupConversation(), currentUser, currentUser.getDisplayName() + " joined " + invite.getGroupConversation().getName());
        notificationService.markRelatedNotificationsAsRead(currentUser.getId(), "GROUP_DM_INVITE", inviteId);
        return GroupConversationInviteResponse.fromEntity(invite);
    }

    @Override
    @Transactional
    public void rejectInvite(Long inviteId, User currentUser) {
        GroupConversationInvite invite = getInviteOrThrow(inviteId);
        if (!invite.getInvitee().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Invite does not belong to current user");
        }
        invite.setStatus(InvitationStatus.REJECTED);
        invite.setRespondedAt(LocalDateTime.now());
        groupConversationInviteRepository.save(invite);
        notificationService.markRelatedNotificationsAsRead(currentUser.getId(), "GROUP_DM_INVITE", inviteId);
    }

    @Override
    @Transactional
    public GroupConversationResponse inviteMembers(Long groupId, GroupConversationInviteRequest request, User currentUser) {
        GroupConversation group = getConversationOrThrow(groupId);
        ensureMember(groupId, currentUser.getId());

        Set<Long> memberIds = new LinkedHashSet<>(request.getMemberIds());
        memberIds.remove(currentUser.getId());

        for (Long memberId : memberIds) {
            if (groupConversationMemberRepository.existsByGroupConversationIdAndUserId(groupId, memberId)) {
                continue;
            }
            if (groupConversationInviteRepository.existsByGroupConversationIdAndInviteeIdAndStatus(groupId, memberId, InvitationStatus.PENDING)) {
                continue;
            }
            if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(group.getWorkspace().getId(), memberId)) {
                continue;
            }

            User invitee = userRepository.findById(memberId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + memberId));
            GroupConversationInvite invite = groupConversationInviteRepository.save(GroupConversationInvite.builder()
                    .groupConversation(group)
                    .inviter(currentUser)
                    .invitee(invitee)
                    .build());
            notificationService.sendNotification(
                    invitee.getId(),
                    "GROUP_DM_INVITE",
                    currentUser.getDisplayName() + " invited you to join group " + group.getName(),
                    invite.getId()
            );
        }

        return mapConversation(group, currentUser);
    }

    @Override
    @Transactional
    public void leaveConversation(Long groupId, User currentUser) {
        GroupConversation group = getConversationOrThrow(groupId);
        if (group.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Group creator cannot leave. Delete the group instead.");
        }

        GroupConversationMember member = groupConversationMemberRepository.findByGroupConversationIdAndUserId(groupId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("You are not a member of this group"));
        groupConversationMemberRepository.delete(member);
        createSystemMessage(group, currentUser, currentUser.getDisplayName() + " left " + group.getName());
        notificationService.markRelatedNotificationsAsRead(currentUser.getId(), "GROUP_DIRECT_MESSAGE", groupId);
    }

    @Override
    @Transactional
    public void deleteConversation(Long groupId, User currentUser) {
        GroupConversation group = getConversationOrThrow(groupId);
        if (!group.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Only the group creator can delete this group");
        }
        groupConversationRepository.delete(group);
    }

    @Override
    @Transactional
    public void removeMember(Long groupId, Long userId, User currentUser) {
        GroupConversation group = getConversationOrThrow(groupId);
        if (!group.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Only the group creator can remove members");
        }
        if (group.getCreatedBy().getId().equals(userId)) {
            throw new UnauthorizedException("Group creator cannot be removed");
        }

        GroupConversationMember member = groupConversationMemberRepository.findByGroupConversationIdAndUserId(groupId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("User is not a member of this group"));
        User removedUser = member.getUser();
        groupConversationMemberRepository.delete(member);
        createSystemMessage(group, currentUser, removedUser.getDisplayName() + " was removed from " + group.getName());
        notificationService.markRelatedNotificationsAsRead(removedUser.getId(), "GROUP_DIRECT_MESSAGE", groupId);
    }

    @Override
    @Transactional
    public MessageResponse editMessage(Long messageId, String content, User currentUser) {
        GroupConversationMessage message = groupConversationMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Group message not found"));
        ensureMember(message.getGroupConversation().getId(), currentUser.getId());
        if (!message.getSender().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only edit your own messages");
        }

        message.setContent(content);
        message.setEditedAt(LocalDateTime.now());
        return mapMessage(groupConversationMessageRepository.save(message));
    }

    @Override
    @Transactional
    public MessageResponse deleteMessage(Long messageId, String scope, User currentUser) {
        GroupConversationMessage message = groupConversationMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Group message not found"));
        ensureMember(message.getGroupConversation().getId(), currentUser.getId());

        if ("self".equalsIgnoreCase(scope)) {
            if (!message.getHiddenForUserIds().contains(currentUser.getId())) {
                message.getHiddenForUserIds().add(currentUser.getId());
            }
            return mapMessage(groupConversationMessageRepository.save(message));
        }

        if (!message.getSender().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only delete your own messages");
        }

        message.setDeleted(true);
        return mapMessage(groupConversationMessageRepository.save(message));
    }

    @Override
    @Transactional
    public MessageResponse pinMessage(Long messageId, User currentUser) {
        GroupConversationMessage message = groupConversationMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Group message not found"));
        ensureMember(message.getGroupConversation().getId(), currentUser.getId());

        message.setPinned(!message.isPinned());
        if (message.isPinned()) {
            message.setPinnedByUserId(currentUser.getId());
            message.setPinnedByName(currentUser.getDisplayName());
        } else {
            message.setPinnedByUserId(null);
            message.setPinnedByName(null);
        }
        return mapMessage(groupConversationMessageRepository.save(message));
    }

    @Override
    @Transactional
    public MessageResponse reactToMessage(Long messageId, String emoji, User currentUser) {
        GroupConversationMessage message = groupConversationMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Group message not found"));
        ensureMember(message.getGroupConversation().getId(), currentUser.getId());

        reactionRepository.findByGroupConversationMessageIdAndUserIdAndEmoji(messageId, currentUser.getId(), emoji)
                .ifPresentOrElse(
                        reactionRepository::delete,
                        () -> reactionRepository.save(Reaction.builder()
                                .groupConversationMessage(message)
                                .user(currentUser)
                                .emoji(emoji)
                                .build())
                );
        reactionRepository.flush();
        return mapMessage(message);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MessageResponse> getMessages(Long groupId, int page, int size, User currentUser) {
        ensureMember(groupId, currentUser.getId());
        Page<GroupConversationMessage> pageResult = groupConversationMessageRepository.findByGroupConversationIdOrderBySentAtDesc(groupId, PageRequest.of(page, size));
        List<MessageResponse> visibleMessages = pageResult.getContent().stream()
                .filter(message -> !message.getHiddenForUserIds().contains(currentUser.getId()))
                .map(this::mapMessage)
                .collect(Collectors.toList());
        return new PageImpl<>(visibleMessages, pageResult.getPageable(), visibleMessages.size());
    }

    @Override
    @Transactional
    public MessageResponse sendMessage(Long groupId, MessageRequest request, User currentUser) {
        GroupConversation group = getConversationOrThrow(groupId);
        ensureMember(groupId, currentUser.getId());

        GroupConversationMessage message = GroupConversationMessage.builder()
                .groupConversation(group)
                .sender(currentUser)
                .content(request.getContent())
                .type(request.getType() != null ? request.getType() : "TEXT")
                .replyToMessageId(request.getReplyToMessageId())
                .build();

        if (request.getReplyToMessageId() != null) {
            GroupConversationMessage replyTarget = groupConversationMessageRepository.findById(request.getReplyToMessageId())
                    .orElseThrow(() -> new ResourceNotFoundException("Group message not found"));
            message.setReplyToContent(replyTarget.isDeleted() ? "This message was deleted." : replyTarget.getContent());
            message.setReplyToSenderName(replyTarget.getSender().getDisplayName());
        }

        GroupConversationMessage saved = groupConversationMessageRepository.save(message);

        groupConversationMemberRepository.findByGroupConversationId(groupId).stream()
                .map(GroupConversationMember::getUser)
                .filter(member -> !member.getId().equals(currentUser.getId()))
                .forEach(member -> notificationService.sendNotification(
                        member.getId(),
                        "GROUP_DIRECT_MESSAGE",
                        currentUser.getDisplayName() + " sent a message in " + group.getName(),
                        groupId
                ));

        return mapMessage(saved);
    }

    @Override
    @Transactional
    public void markAsRead(Long groupId, User currentUser) {
        ensureMember(groupId, currentUser.getId());
        List<GroupConversationMessage> unreadMessages = groupConversationMessageRepository.findUnreadMessagesInGroup(groupId, currentUser.getId());
        List<GroupConversationMessageRead> reads = unreadMessages.stream()
                .map(message -> GroupConversationMessageRead.builder()
                        .message(message)
                        .user(currentUser)
                        .build())
                .collect(Collectors.toList());
        if (!reads.isEmpty()) {
            groupConversationMessageReadRepository.saveAll(reads);
        }
        notificationService.markRelatedNotificationsAsRead(currentUser.getId(), "GROUP_DIRECT_MESSAGE", groupId);
    }

    private GroupConversation getConversationOrThrow(Long groupId) {
        return groupConversationRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group conversation not found"));
    }

    private GroupConversationInvite getInviteOrThrow(Long inviteId) {
        return groupConversationInviteRepository.findById(inviteId)
                .orElseThrow(() -> new ResourceNotFoundException("Group invite not found"));
    }

    private void ensureMember(Long groupId, Long userId) {
        if (!groupConversationMemberRepository.existsByGroupConversationIdAndUserId(groupId, userId)) {
            throw new UnauthorizedException("You are not a member of this group");
        }
    }

    private GroupConversationResponse mapConversation(GroupConversation group, User currentUser) {
        List<UserResponse> members = groupConversationMemberRepository.findByGroupConversationId(group.getId()).stream()
                .map(GroupConversationMember::getUser)
                .map(this::mapUser)
                .collect(Collectors.toList());

        return GroupConversationResponse.builder()
                .id(group.getId())
                .workspaceId(group.getWorkspace().getId())
                .name(group.getName())
                .memberCount(members.size())
                .unreadCount(groupConversationMessageRepository.countUnreadInGroup(group.getId(), currentUser.getId()))
                .createdAt(group.getCreatedAt())
                .createdBy(mapUser(group.getCreatedBy()))
                .members(members)
                .build();
    }

    private UserResponse mapUser(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .online(user.isOnline())
                .role(user.getRole() != null ? user.getRole().name() : "MEMBER")
                .build();
    }

    private MessageResponse mapMessage(GroupConversationMessage message) {
        return MessageResponse.builder()
                .id(message.getId())
                .groupId(message.getGroupConversation().getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getDisplayName())
                .senderAvatar(message.getSender().getAvatarUrl())
                .content(message.isDeleted() ? "This message was deleted." : message.getContent())
                .type(message.getType())
                .isDeleted(message.isDeleted())
                .isPinned(message.isPinned())
                .pinnedByUserId(message.getPinnedByUserId())
                .pinnedByName(message.getPinnedByName())
                .editedAt(message.getEditedAt())
                .sentAt(message.getSentAt())
                .readCount(groupConversationMessageReadRepository.findByMessageId(message.getId()).size())
                .reactions(reactionRepository.findByGroupConversationMessageId(message.getId()).stream()
                        .map(r -> ReactionResponse.builder()
                                .emoji(r.getEmoji())
                                .userId(r.getUser().getId())
                                .username(r.getUser().getDisplayName())
                                .build())
                        .collect(Collectors.toList()))
                .replyToMessageId(message.getReplyToMessageId())
                .replyToContent(message.getReplyToContent())
                .replyToSenderName(message.getReplyToSenderName())
                .build();
    }

    private void createSystemMessage(GroupConversation group, User actor, String content) {
        groupConversationMessageRepository.save(GroupConversationMessage.builder()
                .groupConversation(group)
                .sender(actor)
                .content(content)
                .type("SYSTEM")
                .build());
    }
}
