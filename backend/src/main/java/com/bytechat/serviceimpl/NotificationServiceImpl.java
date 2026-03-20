package com.bytechat.serviceimpl;

import com.bytechat.entity.Notification;
import com.bytechat.entity.User;
import com.bytechat.repository.NotificationRepository;
import com.bytechat.repository.UserRepository;
import com.bytechat.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import com.bytechat.dto.response.NotificationResponse;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public Notification sendNotification(Long recipientId, String type, String content, Long relatedEntityId) {
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("Recipient not found"));

        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .content(content)
                .relatedEntityId(relatedEntityId)
                .build();

        Notification savedNotification = notificationRepository.save(notification);

        // Push via WebSocket to the requested recipient using DTO to avoid LazyInitializationException
        NotificationResponse responseDto = NotificationResponse.fromEntity(savedNotification);
        messagingTemplate.convertAndSend("/topic/user/" + recipientId + "/notifications", responseDto);

        return savedNotification;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByRecipientIdAndIsReadFalse(userId);
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markWorkspaceNotificationsAsRead(Long userId, Long workspaceId) {
        List<Notification> notifications = notificationRepository.findUnreadMentionsByWorkspace(userId, workspaceId);
        notifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifications);
    }

    @Override
    @Transactional
    public void markChannelNotificationsAsRead(Long userId, Long channelId) {
        List<Notification> notifications = notificationRepository.findUnreadMentionsByChannel(userId, channelId);
        notifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifications);
    }

    @Override
    @Transactional
    public void markDMNotificationsAsRead(Long userId, Long senderId) {
        List<Notification> notifications = notificationRepository.findUnreadDMsBySender(userId, senderId);
        notifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifications);
    }

    @Override
    @Transactional
    public void markRelatedNotificationsAsRead(Long userId, String type, Long relatedEntityId) {
        List<Notification> notifications = notificationRepository
                .findByRecipientIdAndTypeAndRelatedEntityIdAndIsReadFalse(userId, type, relatedEntityId);
        notifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(notifications);
    }

    @Override
    @Transactional(readOnly = true)
    public Notification getNotification(Long notificationId) {
        return notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
    }
}
