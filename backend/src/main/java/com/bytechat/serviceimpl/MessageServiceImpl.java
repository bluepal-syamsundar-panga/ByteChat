package com.bytechat.serviceimpl;

import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.MessageReadUserResponse;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.dto.response.ReactionResponse;
import com.bytechat.entity.Channel;
import com.bytechat.entity.Message;
import com.bytechat.entity.Reaction;
import com.bytechat.entity.WorkspaceMember;
import com.bytechat.entity.User;
import com.bytechat.entity.MessageRead;
import com.bytechat.exception.ResourceNotFoundException;
import com.bytechat.exception.UnauthorizedException;
import com.bytechat.repository.ChannelRepository;
import com.bytechat.repository.MessageReadRepository;
import com.bytechat.repository.MessageRepository;
import com.bytechat.repository.ReactionRepository;
import com.bytechat.repository.WorkspaceMemberRepository;
import com.bytechat.services.MessageService;
import com.bytechat.services.NotificationService;
import com.bytechat.repository.ChannelMemberRepository;
import com.bytechat.dto.response.NotificationResponse;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final ChannelRepository channelRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final ChannelMemberRepository channelMemberRepository;
    private final ReactionRepository reactionRepository;
    private final NotificationService notificationService;
    private final MessageReadRepository messageReadRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private static final Pattern MENTION_PATTERN = Pattern.compile("@([A-Za-z0-9._-]+)");

    @Override
    @Transactional
    public MessageResponse sendMessage(Long channelId, MessageRequest request, User sender) {
        log.info("Sending message to channel {} by user {}", channelId, sender.getEmail());
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found with ID: " + channelId));
        
        Long workspaceId = channel.getWorkspace().getId();
                
        // Ensure user is member of the workspace
        if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, sender.getId())) {
            log.warn("Access denied: User {} is not a member of workspace {}", sender.getEmail(), workspaceId);
            throw new UnauthorizedException("User is not a member of this workspace");
        }

        Message message = Message.builder()
                .channel(channel)
                .sender(sender)
                .content(request.getContent())
                .type(request.getType() != null ? request.getType() : "TEXT")
                .replyToMessageId(request.getReplyToMessageId())
                .mentionedUserIds(new ArrayList<>())
                .build();

        if (request.getReplyToMessageId() != null) {
            Message replyTarget = getMessageOrThrow(request.getReplyToMessageId());
            message.setReplyToContent(replyTarget.isDeleted() ? "This message was deleted." : replyTarget.getContent());
            message.setReplyToSenderName(replyTarget.getSender().getDisplayName());
        }
                
        message = messageRepository.save(message);
        log.info("Message saved with ID: {}", message.getId());

        try {
            List<Long> mentionedIds = notifyMentionedUsers(message, sender);
            message.setMentionedUserIds(mentionedIds);
            message = messageRepository.save(message);
            log.debug("Mentions processed for message {}: {}", message.getId(), mentionedIds);
        } catch (Exception e) {
            log.error("Mentions processing failed for message {}: {}", message.getId(), e.getMessage());
        }
        
        MessageResponse response = mapToResponse(message);
        notifyChannelMembers(channelId, sender.getId(), response);
        
        return response;
    }

    @Override
    public Page<MessageResponse> getRoomMessages(Long channelId, int page, int size, User currentUser) {
        log.info("Fetching messages for channel {} (page: {}, size: {})", channelId, page, size);
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found"));
        
        Long workspaceId = channel.getWorkspace().getId();
        
        if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, currentUser.getId())) {
             log.warn("Access denied: User {} tried to access messages for channel {}", currentUser.getEmail(), channelId);
             throw new UnauthorizedException("User is not a member of this workspace");
        }
        
        Page<Message> pageResult = messageRepository.findByChannelIdOrderBySentAtDesc(channelId, PageRequest.of(page, size));
        List<MessageResponse> visibleMessages = pageResult.getContent().stream()
                .filter(message -> !message.getHiddenForUserIds().contains(currentUser.getId()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        Page<MessageResponse> messages = new PageImpl<>(visibleMessages, pageResult.getPageable(), visibleMessages.size());
        log.debug("Returned {} messages for channel {}", messages.getNumberOfElements(), channelId);
        return messages;
    }

    @Override
    public MessageResponse getMessageResponse(Long messageId, User currentUser) {
        Message message = getMessageOrThrow(messageId);
        if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(message.getChannel().getWorkspace().getId(), currentUser.getId())) {
            throw new UnauthorizedException("User is not a member of this workspace");
        }
        return mapToResponse(message);
    }

    @Override
    @Transactional
    public MessageResponse editMessage(Long messageId, MessageRequest request, User currentUser) {
        log.info("User {} editing message {}", currentUser.getEmail(), messageId);
        Message message = getMessageOrThrow(messageId);
        
        if (!message.getSender().getId().equals(currentUser.getId())) {
            log.warn("Edit denied: User {} is not the sender of message {}", currentUser.getEmail(), messageId);
            throw new UnauthorizedException("You can only edit your own messages");
        }
        
        message.setContent(request.getContent());
        message.setEditedAt(LocalDateTime.now());
        
        List<Long> mentionedIds = notifyMentionedUsers(message, currentUser);
        message.setMentionedUserIds(mentionedIds);
        Message savedMessage = messageRepository.save(message);
        log.info("Message {} successfully edited", messageId);
        return mapToResponse(savedMessage);
    }

    @Override
    @Transactional
    public MessageResponse deleteMessage(Long messageId, String scope, User currentUser) {
        log.info("User {} deleting message {}", currentUser.getEmail(), messageId);
        Message message = getMessageOrThrow(messageId);

        if ("self".equalsIgnoreCase(scope)) {
            if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(message.getChannel().getWorkspace().getId(), currentUser.getId())) {
                throw new UnauthorizedException("Must be a member of the workspace to hide messages");
            }
            if (!message.getHiddenForUserIds().contains(currentUser.getId())) {
                message.getHiddenForUserIds().add(currentUser.getId());
            }
            return mapToResponse(messageRepository.save(message));
        }

        if (!message.getSender().getId().equals(currentUser.getId())) {
            log.warn("Delete denied: User {} is not the sender of message {}", currentUser.getEmail(), messageId);
            throw new UnauthorizedException("You can only delete your own messages");
        }
        
        message.setDeleted(true);
        Message savedMessage = messageRepository.save(message);
        log.info("Message {} marked as deleted", messageId);
        return mapToResponse(savedMessage);
    }

    @Override
    @Transactional
    public void markAsRead(Long messageId, User currentUser) {
        if (!messageReadRepository.existsByMessageIdAndUserId(messageId, currentUser.getId())) {
            log.debug("Marking message {} as read for user {}", messageId, currentUser.getEmail());
            Message message = getMessageOrThrow(messageId);
            MessageRead messageRead = MessageRead.builder()
                    .message(message)
                    .user(currentUser)
                    .build();
            messageReadRepository.save(messageRead);
        }
    }

    @Override
    @Transactional
    public void markChannelAsRead(Long channelId, User currentUser) {
        log.info("Marking all messages in channel {} as read for user {}", channelId, currentUser.getEmail());
        List<Message> unreadMessages = messageRepository.findUnreadMessagesInChannel(channelId, currentUser.getId());
        
        List<MessageRead> reads = unreadMessages.stream()
                .map(m -> MessageRead.builder()
                        .message(m)
                        .user(currentUser)
                        .build())
                .collect(Collectors.toList());
        
        if (!reads.isEmpty()) {
            messageReadRepository.saveAll(reads);
            log.info("Marked {} messages as read in channel {} for user {}", reads.size(), channelId, currentUser.getEmail());
        }

        // Also mark channel notifications (mentions, etc.) as read
        notificationService.markChannelNotificationsAsRead(currentUser.getId(), channelId);
    }

    @Override
    @Transactional
    public MessageResponse pinMessage(Long messageId, User currentUser) {
         log.info("User {} toggling pin for message {}", currentUser.getEmail(), messageId);
         Message message = getMessageOrThrow(messageId);
         
         if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(message.getChannel().getWorkspace().getId(), currentUser.getId())) {
             log.warn("Pin denied: User {} is not a member of workspace {}", currentUser.getEmail(), message.getChannel().getWorkspace().getId());
             throw new UnauthorizedException("Must be a member of the workspace to pin messages");
         }
         
         message.setPinned(!message.isPinned());
         if (message.isPinned()) {
             message.setPinnedByUserId(currentUser.getId());
             message.setPinnedByName(currentUser.getDisplayName());
         } else {
             message.setPinnedByUserId(null);
             message.setPinnedByName(null);
         }
         Message saved = messageRepository.save(message);
         log.info("Message {} pin status: {}", messageId, saved.isPinned());
         return mapToResponse(saved);
    }

    @Override
    @Transactional
    public MessageResponse reactToMessage(Long messageId, String emoji, User currentUser) {
        log.debug("User {} reacting with {} to message {}", currentUser.getEmail(), emoji, messageId);
        Message message = getMessageOrThrow(messageId);
        
        reactionRepository.findByMessageIdAndUserIdAndEmoji(messageId, currentUser.getId(), emoji)
                .ifPresentOrElse(
                        r -> {
                            reactionRepository.delete(r);
                            log.debug("Removed reaction {} from message {}", emoji, messageId);
                        },
                        () -> {
                            reactionRepository.save(Reaction.builder()
                                .message(message)
                                .user(currentUser)
                                .emoji(emoji)
                                .build());
                            log.debug("Added reaction {} to message {}", emoji, messageId);
                        }
                );
        reactionRepository.flush();
        
        return mapToResponse(message);
    }

    private Message getMessageOrThrow(Long id) {
        return messageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with ID: " + id));
    }

    private MessageResponse mapToResponse(Message message) {
        MessageResponse response = MessageResponse.builder()
                .id(message.getId())
                .roomId(message.getChannel().getWorkspace().getId())
                .channelId(message.getChannel().getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getDisplayName())
                .senderAvatar(message.getSender().getAvatarUrl())
                // Hide content if deleted
                .content(message.isDeleted() ? "This message was deleted." : message.getContent())
                .type(message.getType())
                .isDeleted(message.isDeleted())
                .isPinned(message.isPinned())
                .pinnedByUserId(message.getPinnedByUserId())
                .pinnedByName(message.getPinnedByName())
                .editedAt(message.getEditedAt())
                .sentAt(message.getSentAt())
                .mentionedUserIds(message.getMentionedUserIds())
                .reactions(reactionRepository.findByMessageId(message.getId()).stream()
                        .map(r -> ReactionResponse.builder()
                                .emoji(r.getEmoji())
                                .userId(r.getUser().getId())
                                .username(r.getUser().getDisplayName())
                                .build())
                        .collect(Collectors.toList()))
                .readBy(messageReadRepository.findByMessageId(message.getId()).stream()
                        .filter(mr -> !mr.getUser().getId().equals(message.getSender().getId()))
                        .map(mr -> MessageReadUserResponse.builder()
                                .id(mr.getUser().getId())
                                .displayName(mr.getUser().getDisplayName())
                                .avatarUrl(mr.getUser().getAvatarUrl())
                                .build())
                        .distinct()
                        .collect(Collectors.toList()))
                .replyToMessageId(message.getReplyToMessageId())
                .replyToContent(message.getReplyToContent())
                .replyToSenderName(message.getReplyToSenderName())
                .build();
        
        response.setReadCount((int) messageReadRepository.findByMessageId(message.getId()).stream()
                .filter(mr -> !mr.getUser().getId().equals(message.getSender().getId()))
                .map(mr -> mr.getUser().getDisplayName())
                .distinct()
                .count());
        
        return response;
    }

    private List<Long> notifyMentionedUsers(Message message, User sender) {
        List<Long> mentionedUserIds = new ArrayList<>();
        List<WorkspaceMember> members = workspaceMemberRepository.findByWorkspaceId(message.getChannel().getWorkspace().getId());
        Matcher matcher = MENTION_PATTERN.matcher(message.getContent());

        while (matcher.find()) {
            String mentionToken = normalize(matcher.group(1));

            members.stream()
                    .map(WorkspaceMember::getUser)
                    .filter(user -> !user.getId().equals(sender.getId()))
                    .filter(user -> normalize(user.getDisplayName()).equals(mentionToken))
                    .findFirst()
                    .ifPresent(user -> {
                        mentionedUserIds.add(user.getId());
                        notificationService.sendNotification(
                                user.getId(),
                                "MENTION",
                                sender.getDisplayName() + " mentioned you in #" + message.getChannel().getName(),
                                message.getId()
                        );
                    });
        }
        
        return mentionedUserIds;
    }

    private void notifyChannelMembers(Long channelId, Long senderId, MessageResponse response) {
        try {
            List<com.bytechat.entity.ChannelMember> members = channelMemberRepository.findByChannelId(channelId);
            for (com.bytechat.entity.ChannelMember member : members) {
                // Don't notify the sender
                if (member.getUser().getId().equals(senderId)) continue;
                
                // Send a lightweight notification to trigger unread count increment in frontend
                NotificationResponse notification = NotificationResponse.builder()
                        .type("CHANNEL_MESSAGE")
                        .content("NEW_MESSAGE")
                        .relatedEntityId(channelId)
                        .recipientId(member.getUser().getId())
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build();
                
                messagingTemplate.convertAndSend("/topic/user/" + member.getUser().getId() + "/notifications", notification);
            }
        } catch (Exception e) {
            log.error("Failed to notify channel members for channel {}: {}", channelId, e.getMessage());
        }
    }

    private String normalize(String value) {
        return value == null ? "" : value.replaceAll("\\s+", "").toLowerCase(Locale.ROOT);
    }
}
