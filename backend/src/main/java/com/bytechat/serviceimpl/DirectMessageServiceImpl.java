package com.bytechat.serviceimpl;

import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.dto.response.ReactionResponse;
import com.bytechat.entity.DMRequestStatus;
import com.bytechat.entity.DirectMessage;
import com.bytechat.entity.Reaction;
import com.bytechat.entity.User;
import com.bytechat.exception.ResourceNotFoundException;
import com.bytechat.exception.UnauthorizedException;
import com.bytechat.repository.DMRequestRepository;
import com.bytechat.repository.DirectMessageRepository;
import com.bytechat.repository.ReactionRepository;
import com.bytechat.repository.UserRepository;
import com.bytechat.services.DirectMessageService;
import com.bytechat.services.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DirectMessageServiceImpl implements DirectMessageService {

    private final DirectMessageRepository directMessageRepository;
    private final UserRepository userRepository;
    private final DMRequestRepository dmRequestRepository;
    private final NotificationService notificationService;
    private final ReactionRepository reactionRepository;

    @Override
    @Transactional
    public MessageResponse sendDirectMessage(Long toUserId, MessageRequest request, User sender) {
        log.info("Sending direct message from {} to user ID {}", sender.getEmail(), toUserId);
        User toUser = userRepository.findById(toUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipient user not found with ID: " + toUserId));

        // Check permission: Shared room OR accepted DM request
        boolean sharesRoom = userRepository.findUsersSharingRoomWith(sender.getId(), DMRequestStatus.ACCEPTED).stream()
                .anyMatch(u -> u.getId().equals(toUserId));
        
        if (!sharesRoom) {
            boolean hasAcceptedRequest = dmRequestRepository.existsBySenderAndReceiverAndStatus(sender, toUser, DMRequestStatus.ACCEPTED) ||
                                         dmRequestRepository.existsBySenderAndReceiverAndStatus(toUser, sender, DMRequestStatus.ACCEPTED);
            
            if (!hasAcceptedRequest) {
                log.warn("DM denied: User {} and {} do not share a room or have an accepted DM request", sender.getEmail(), toUser.getEmail());
                throw new UnauthorizedException("You do not have permission to send direct messages to this user.");
            }
        }

        DirectMessage dm = DirectMessage.builder()
                .fromUser(sender)
                .toUser(toUser)
                .content(request.getContent())
                .type(request.getType() != null ? request.getType() : "TEXT")
                .replyToMessageId(request.getReplyToMessageId())
                .build();

        if (request.getReplyToMessageId() != null) {
            DirectMessage replyTarget = directMessageRepository.findById(request.getReplyToMessageId())
                    .orElseThrow(() -> new ResourceNotFoundException("Direct message not found"));
            dm.setReplyToContent(replyTarget.isDeleted() ? "This message was deleted." : replyTarget.getContent());
            dm.setReplyToSenderName(replyTarget.getFromUser().getDisplayName());
        }
                
        dm = directMessageRepository.save(dm);
        log.info("Direct message saved with ID: {}", dm.getId());
        
        // Check if the message mentions the recipient
        String content = request.getContent().toLowerCase();
        String recipientMention = "@" + toUser.getDisplayName().replaceAll("\\s+", "").toLowerCase();
        boolean mentionsRecipient = content.contains(recipientMention);
        
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
        log.info("Fetching DM conversation between {} and user ID {} (page: {}, size: {})", currentUser.getEmail(), otherUserId, page, size);
        Page<DirectMessage> pageResult = directMessageRepository.findConversation(currentUser.getId(), otherUserId, PageRequest.of(page, size));
        List<MessageResponse> visibleMessages = pageResult.getContent().stream()
                .filter(dm -> !dm.getHiddenForUserIds().contains(currentUser.getId()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return new PageImpl<>(visibleMessages, pageResult.getPageable(), visibleMessages.size());
    }

    @Override
    @Transactional
    public void markAsRead(Long otherUserId, User currentUser) {
        log.info("Marking DMs from user ID {} as read for user {}", otherUserId, currentUser.getEmail());
        directMessageRepository.findConversation(currentUser.getId(), otherUserId, PageRequest.of(0, 1000))
                .forEach(dm -> {
                    if (dm.getToUser().getId().equals(currentUser.getId()) && dm.getReadAt() == null) {
                        dm.setReadAt(LocalDateTime.now());
                        directMessageRepository.save(dm);
                    }
                });
        
        notificationService.markDMNotificationsAsRead(currentUser.getId(), otherUserId);
    }

    @Override
    @Transactional
    public MessageResponse editMessage(Long dmId, String content, User currentUser) {
        log.info("User {} editing DM {}", currentUser.getEmail(), dmId);
        DirectMessage dm = directMessageRepository.findById(dmId)
                .orElseThrow(() -> new ResourceNotFoundException("Direct message not found"));
        
        if (!dm.getFromUser().getId().equals(currentUser.getId())) {
            log.warn("Edit denied: User {} is not the sender of DM {}", currentUser.getEmail(), dmId);
            throw new UnauthorizedException("You can only edit your own messages");
        }
        
        dm.setContent(content);
        dm.setEditedAt(LocalDateTime.now());
        DirectMessage saved = directMessageRepository.save(dm);
        log.info("DM {} successfully edited", dmId);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public MessageResponse deleteMessage(Long dmId, String scope, User currentUser) {
        log.info("User {} deleting DM {}", currentUser.getEmail(), dmId);
        DirectMessage dm = directMessageRepository.findById(dmId)
                .orElseThrow(() -> new ResourceNotFoundException("Direct message not found"));

        if ("self".equalsIgnoreCase(scope)) {
            if (!dm.getFromUser().getId().equals(currentUser.getId()) && !dm.getToUser().getId().equals(currentUser.getId())) {
                throw new UnauthorizedException("Unauthorized to hide this message");
            }
            if (!dm.getHiddenForUserIds().contains(currentUser.getId())) {
                dm.getHiddenForUserIds().add(currentUser.getId());
            }
            return mapToResponse(directMessageRepository.save(dm));
        }

        if (!dm.getFromUser().getId().equals(currentUser.getId())) {
            log.warn("Delete denied: User {} is not the sender of DM {}", currentUser.getEmail(), dmId);
            throw new UnauthorizedException("You can only delete your own messages");
        }
        
        dm.setDeleted(true);
        DirectMessage saved = directMessageRepository.save(dm);
        log.info("DM {} marked as deleted", dmId);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public MessageResponse pinMessage(Long dmId, User currentUser) {
        log.info("User {} toggling pin for DM {}", currentUser.getEmail(), dmId);
        DirectMessage dm = directMessageRepository.findById(dmId)
                .orElseThrow(() -> new ResourceNotFoundException("Direct message not found"));
        
        if (!dm.getFromUser().getId().equals(currentUser.getId()) && !dm.getToUser().getId().equals(currentUser.getId())) {
            log.warn("Pin denied: User {} is not part of DM {}", currentUser.getEmail(), dmId);
            throw new UnauthorizedException("Unauthorized to pin this message");
        }
        
        dm.setPinned(!dm.isPinned());
        if (dm.isPinned()) {
            dm.setPinnedByUserId(currentUser.getId());
            dm.setPinnedByName(currentUser.getDisplayName());
        } else {
            dm.setPinnedByUserId(null);
            dm.setPinnedByName(null);
        }
        DirectMessage saved = directMessageRepository.save(dm);
        log.info("DM {} pin status: {}", dmId, saved.isPinned());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public MessageResponse reactToMessage(Long dmId, String emoji, User currentUser) {
        log.debug("User {} reacting with {} to DM {}", currentUser.getEmail(), emoji, dmId);
        DirectMessage dm = directMessageRepository.findById(dmId)
                .orElseThrow(() -> new ResourceNotFoundException("Direct message not found"));
        
        reactionRepository.findByDirectMessageIdAndUserIdAndEmoji(dmId, currentUser.getId(), emoji)
                .ifPresentOrElse(
                        r -> {
                            reactionRepository.delete(r);
                            log.debug("Removed reaction {} from DM {}", emoji, dmId);
                        },
                        () -> {
                            reactionRepository.save(Reaction.builder()
                                .directMessage(dm)
                                .user(currentUser)
                                .emoji(emoji)
                                .build());
                            log.debug("Added reaction {} to DM {}", emoji, dmId);
                        }
                );
        reactionRepository.flush();

        notificationService.sendNotification(
                dm.getFromUser().getId().equals(currentUser.getId()) ? dm.getToUser().getId() : dm.getFromUser().getId(),
                "REACTION",
                currentUser.getDisplayName() + " reacted to your message",
                dm.getId()
        );

        return mapToResponse(dm);
    }

    private MessageResponse mapToResponse(DirectMessage dm) {
        MessageResponse response = MessageResponse.builder()
                .id(dm.getId())
                .roomId(dm.getWorkspace() != null ? dm.getWorkspace().getId() : null)
                .senderId(dm.getFromUser().getId())
                .recipientId(dm.getToUser().getId())
                .senderName(dm.getFromUser().getDisplayName())
                .senderAvatar(dm.getFromUser().getAvatarUrl())
                .content(dm.isDeleted() ? "This message was deleted." : dm.getContent())
                .type(dm.getType())
                .isDeleted(dm.isDeleted())
                .isPinned(dm.isPinned())
                .pinnedByUserId(dm.getPinnedByUserId())
                .pinnedByName(dm.getPinnedByName())
                .sentAt(dm.getSentAt())
                .editedAt(dm.getEditedAt())
                .reactions(reactionRepository.findByDirectMessageId(dm.getId()).stream()
                        .map(r -> ReactionResponse.builder()
                                .emoji(r.getEmoji())
                                .userId(r.getUser().getId())
                                .username(r.getUser().getDisplayName())
                                .build())
                        .collect(Collectors.toList()))
                .replyToMessageId(dm.getReplyToMessageId())
                .replyToContent(dm.getReplyToContent())
                .replyToSenderName(dm.getReplyToSenderName())
                .build();
        
        response.setReadCount(dm.getReadAt() != null ? 1 : 0);
        return response;
    }
}
