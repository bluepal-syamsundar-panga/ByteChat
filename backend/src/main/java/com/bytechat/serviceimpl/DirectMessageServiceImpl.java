package com.bytechat.serviceimpl;

import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.entity.DirectMessage;
import com.bytechat.entity.User;
import com.bytechat.repository.DirectMessageRepository;
import com.bytechat.repository.UserRepository;
import com.bytechat.services.DirectMessageService;
import com.bytechat.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class DirectMessageServiceImpl implements DirectMessageService {

    private final DirectMessageRepository directMessageRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public MessageResponse sendDirectMessage(Long toUserId, MessageRequest request, User sender) {
        User toUser = userRepository.findById(toUserId)
                .orElseThrow(() -> new RuntimeException("Recipient not found"));

        DirectMessage dm = DirectMessage.builder()
                .fromUser(sender)
                .toUser(toUser)
                .content(request.getContent())
                .type(request.getType() != null ? request.getType() : "TEXT")
                .build();
                
        dm = directMessageRepository.save(dm);
        
        // Check if the message mentions the recipient
        boolean mentionsRecipient = request.getContent().contains("@" + toUser.getDisplayName().replaceAll("\\s+", ""));
        
        notificationService.sendNotification(
                toUser.getId(),
                mentionsRecipient ? "MENTION" : "DIRECT_MESSAGE",
                mentionsRecipient 
                    ? sender.getDisplayName() + " mentioned you in a direct message"
                    : sender.getDisplayName() + " sent you a direct message",
                dm.getId()
        );
        return mapToResponse(dm);
    }

    @Override
    public Page<MessageResponse> getDirectMessages(Long otherUserId, int page, int size, User currentUser) {
        return directMessageRepository.findConversation(currentUser.getId(), otherUserId, PageRequest.of(page, size))
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    // Very simplified logic, real app would take a list of message IDs
    public void markAsRead(Long otherUserId, User currentUser) {
        // Here you would typically get all unread direct messages from `otherUser` to `currentUser` and set readAt.
        // For simplicity, we assume this acts as a read receipt flag.
    }

    private MessageResponse mapToResponse(DirectMessage dm) {
        return MessageResponse.builder()
                .id(dm.getId())
                .senderId(dm.getFromUser().getId())
                .senderName(dm.getFromUser().getDisplayName())
                .senderAvatar(dm.getFromUser().getAvatarUrl())
                // Hide content if deleted
                .content(dm.isDeleted() ? "This message was deleted." : dm.getContent())
                .type(dm.getType())
                .isDeleted(dm.isDeleted())
                .isPinned(false) // DMs usually don't have pinned in simple slack clone
                .sentAt(dm.getSentAt())
                .build();
    }
}
