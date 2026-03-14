package com.bytechat.serviceimpl;

import com.bytechat.entity.Notification;
import com.bytechat.entity.User;
import com.bytechat.repository.NotificationRepository;
import com.bytechat.repository.UserRepository;
import com.bytechat.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

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

        return notificationRepository.save(notification);
    }

    @Override
    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByRecipientIdAndIsReadFalse(userId);
    }

    @Override
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setRead(true);
        notificationRepository.save(notification);
    }
}
