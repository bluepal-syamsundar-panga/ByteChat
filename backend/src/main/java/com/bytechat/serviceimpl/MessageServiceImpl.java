package com.bytechat.serviceimpl;

import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.dto.response.ReactionResponse;
import com.bytechat.entity.Message;
import com.bytechat.entity.Room;
import com.bytechat.entity.RoomMember;
import com.bytechat.entity.User;
import com.bytechat.repository.MessageRepository;
import com.bytechat.repository.ReactionRepository;
import com.bytechat.repository.RoomMemberRepository;
import com.bytechat.repository.RoomRepository;
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
    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final ReactionRepository reactionRepository;
    private final NotificationService notificationService;

    private static final Pattern MENTION_PATTERN = Pattern.compile("@([A-Za-z0-9._-]+)");

    @Override
    @Transactional
    public MessageResponse sendMessage(Long roomId, MessageRequest request, User sender) {
        log.info("Attempting to send message to room {} by user {}", roomId, sender.getEmail());
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
                
        // Ensure user is member
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, sender.getId())) {
            log.warn("User {} is not a member of room {}", sender.getEmail(), roomId);
            throw new RuntimeException("User is not a member of this room");
        }

        Message message = Message.builder()
                .room(room)
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
            // We don't rethrow to allow the message itself to be sent
        }
        
        return mapToResponse(message);
    }

    @Override
    public Page<MessageResponse> getRoomMessages(Long roomId, int page, int size, User currentUser) {
        // Ensure joined
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, currentUser.getId())) {
             throw new RuntimeException("User is not a member of this room");
        }
        
        Page<MessageResponse> messages = messageRepository.findByRoomIdOrderBySentAtDesc(roomId, PageRequest.of(page, size))
                .map(this::mapToResponse);
        log.info("Fetched {} messages for room {}", messages.getNumberOfElements(), roomId);
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
    public void deleteMessage(Long messageId, User currentUser) {
        Message message = getMessageOrThrow(messageId);
        
        if (!message.getSender().getId().equals(currentUser.getId())) {
             throw new RuntimeException("You can only delete your own messages");
        }
        
        message.setDeleted(true);
        messageRepository.save(message);            
    }

    @Override
    @Transactional
    public MessageResponse pinMessage(Long messageId, User currentUser) {
         Message message = getMessageOrThrow(messageId);
         // Any member can pin a message
         if (!roomMemberRepository.existsByRoomIdAndUserId(message.getRoom().getId(), currentUser.getId())) {
             throw new RuntimeException("Must be a member to pin messages");
         }
         
         message.setPinned(!message.isPinned()); // Toggle
         return mapToResponse(messageRepository.save(message));
    }

    private Message getMessageOrThrow(Long id) {
        return messageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Message not found"));
    }

    private MessageResponse mapToResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .roomId(message.getRoom().getId())
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
    }

    private List<Long> notifyMentionedUsers(Message message, User sender) {
        List<Long> mentionedUserIds = new ArrayList<>();
        List<RoomMember> members = roomMemberRepository.findByRoomId(message.getRoom().getId());
        Matcher matcher = MENTION_PATTERN.matcher(message.getContent());

        while (matcher.find()) {
            String mentionToken = normalize(matcher.group(1));

            members.stream()
                    .map(RoomMember::getUser)
                    .filter(user -> !user.getId().equals(sender.getId()))
                    .filter(user -> normalize(user.getDisplayName()).equals(mentionToken))
                    .findFirst()
                    .ifPresent(user -> {
                        mentionedUserIds.add(user.getId());
                        notificationService.sendNotification(
                                user.getId(),
                                "MENTION",
                                sender.getDisplayName() + " mentioned you in #" + message.getRoom().getName(),
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
