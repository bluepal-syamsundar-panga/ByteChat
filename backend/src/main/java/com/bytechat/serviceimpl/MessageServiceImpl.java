package com.bytechat.serviceimpl;

import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.dto.response.ReactionResponse;
import com.bytechat.entity.Channel;
import com.bytechat.entity.Message;
import com.bytechat.entity.WorkspaceMember;
import com.bytechat.entity.User;
import com.bytechat.entity.MessageRead;
import com.bytechat.repository.ChannelRepository;
import com.bytechat.repository.MessageReadRepository;
import com.bytechat.repository.MessageRepository;
import com.bytechat.repository.ReactionRepository;
import com.bytechat.repository.WorkspaceMemberRepository;
import com.bytechat.services.MessageService;
import com.bytechat.services.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
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
    private final ReactionRepository reactionRepository;
    private final NotificationService notificationService;
    private final MessageReadRepository messageReadRepository;

    private static final Pattern MENTION_PATTERN = Pattern.compile("@([A-Za-z0-9._-]+)");

    @Override
    @Transactional
    public MessageResponse sendMessage(Long channelId, MessageRequest request, User sender) {
        log.info("Attempting to send message to channel {} by user {}", channelId, sender.getEmail());
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new RuntimeException("Channel not found"));
        
        if (channel.isArchived()) {
            throw new RuntimeException("Cannot send message to an archived channel");
        }
        
        Long workspaceId = channel.getWorkspace().getId();
                
        // Ensure user is member of the workspace
        if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, sender.getId())) {
            log.warn("User {} is not a member of workspace {}", sender.getEmail(), workspaceId);
            throw new RuntimeException("User is not a member of this workspace");
        }

        Message message = Message.builder()
                .channel(channel)
                .sender(sender)
                .content(request.getContent())
                .type(request.getType() != null ? request.getType() : "TEXT")
                .mentionedUserIds(new ArrayList<>())
                .build();
                
        message = messageRepository.save(message);
        log.info("Message saved initial ID: {}", message.getId());

        try {
            List<Long> mentionedIds = notifyMentionedUsers(message, sender);
            message.setMentionedUserIds(mentionedIds);
            message = messageRepository.save(message);
            log.info("Message {} updated with {} mentions", message.getId(), mentionedIds.size());
        } catch (Exception e) {
            log.error("Failed to process mentions for message {}: {}", message.getId(), e.getMessage());
        }
        
        return mapToResponse(message);
    }

    @Override
    public Page<MessageResponse> getRoomMessages(Long channelId, int page, int size, User currentUser) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new RuntimeException("Channel not found"));
        
        Long workspaceId = channel.getWorkspace().getId();
        
        // Ensure joined workspace
        if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, currentUser.getId())) {
             throw new RuntimeException("User is not a member of this workspace");
        }
        
        Page<MessageResponse> messages = messageRepository.findByChannelIdOrderBySentAtDesc(channelId, PageRequest.of(page, size))
                .map(this::mapToResponse);
        log.info("Fetched {} messages for channel {}", messages.getNumberOfElements(), channelId);
        return messages;
    }

    @Override
    @Transactional
    public MessageResponse editMessage(Long messageId, MessageRequest request, User currentUser) {
        Message message = getMessageOrThrow(messageId);
        
        if (!message.getSender().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You can only edit your own messages");
        }
        
        message.setContent(request.getContent());
        message.setEditedAt(LocalDateTime.now());
        
        List<Long> mentionedIds = notifyMentionedUsers(message, currentUser);
        message.setMentionedUserIds(mentionedIds);
        Message savedMessage = messageRepository.save(message);
        return mapToResponse(savedMessage);
    }

    @Override
    @Transactional
    public MessageResponse deleteMessage(Long messageId, User currentUser) {
        Message message = getMessageOrThrow(messageId);
        
        if (!message.getSender().getId().equals(currentUser.getId())) {
             throw new RuntimeException("You can only delete your own messages");
        }
        
        message.setDeleted(true);
        Message savedMessage = messageRepository.save(message);
        return mapToResponse(savedMessage);
    }

    @Override
    @Transactional
    public void markAsRead(Long messageId, User currentUser) {
        if (!messageReadRepository.existsByMessageIdAndUserId(messageId, currentUser.getId())) {
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
    public MessageResponse pinMessage(Long messageId, User currentUser) {
         Message message = getMessageOrThrow(messageId);
         // Any member can pin a message
         if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(message.getChannel().getWorkspace().getId(), currentUser.getId())) {
             throw new RuntimeException("Must be a member of the workspace to pin messages");
         }
         
         message.setPinned(!message.isPinned()); // Toggle
         return mapToResponse(messageRepository.save(message));
    }

    private Message getMessageOrThrow(Long id) {
        return messageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Message not found"));
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
                .build();
        
        response.setReadCount((int) messageReadRepository.findByMessageId(message.getId()).stream()
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

    private String normalize(String value) {
        return value == null ? "" : value.replaceAll("\\s+", "").toLowerCase(Locale.ROOT);
    }
}
