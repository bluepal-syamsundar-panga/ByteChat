package com.bytechat.serviceimpl;

import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.entity.Message;
import com.bytechat.entity.Room;
import com.bytechat.entity.User;
import com.bytechat.repository.MessageRepository;
import com.bytechat.repository.RoomMemberRepository;
import com.bytechat.repository.RoomRepository;
import com.bytechat.services.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;

    @Override
    @Transactional
    public MessageResponse sendMessage(Long roomId, MessageRequest request, User sender) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
                
        // Ensure user is member
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, sender.getId())) {
            throw new RuntimeException("User is not a member of this room");
        }

        Message message = Message.builder()
                .room(room)
                .sender(sender)
                .content(request.getContent())
                .type(request.getType() != null ? request.getType() : "TEXT")
                .build();
                
        message = messageRepository.save(message);
        return mapToResponse(message);
    }

    @Override
    public Page<MessageResponse> getRoomMessages(Long roomId, int page, int size, User currentUser) {
        // Ensure joined
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, currentUser.getId())) {
             throw new RuntimeException("User is not a member of this room");
        }
        
        return messageRepository.findByRoomIdOrderBySentAtDesc(roomId, PageRequest.of(page, size))
                .map(this::mapToResponse);
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
        
        return mapToResponse(messageRepository.save(message));
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
                .build();
    }
}
