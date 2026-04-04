package com.bytechat.serviceimpl;

import com.bytechat.entity.Notification;
import com.bytechat.entity.User;
import com.bytechat.repository.NotificationRepository;
import com.bytechat.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class NotificationServiceImplTest {

    private NotificationRepository notificationRepository;
    private UserRepository userRepository;
    private SimpMessagingTemplate messagingTemplate;
    private NotificationServiceImpl notificationService;

    private User recipient;
    private Notification notification;

    @BeforeEach
    void setUp() {
        notificationRepository = mock(NotificationRepository.class);
        userRepository = mock(UserRepository.class);

        MessageChannel channel = new MessageChannel() {
            @Override
            public boolean send(Message<?> message) {
                return true;
            }

            @Override
            public boolean send(Message<?> message, long timeout) {
                return true;
            }
        };
        messagingTemplate = new SimpMessagingTemplate(channel);

        notificationService = new NotificationServiceImpl(
                notificationRepository,
                userRepository,
                messagingTemplate
        );

        recipient = User.builder()
                .id(1L)
                .email("user@example.com")
                .displayName("User")
                .build();

        notification = Notification.builder()
                .id(1L)
                .recipient(recipient)
                .content("Test")
                .type("INFO")
                .build();
    }

    @Test
    void sendNotification_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(recipient));
        when(notificationRepository.save(any(Notification.class))).thenReturn(notification);

        Notification result = notificationService.sendNotification(1L, "INFO", "Test", 1L);

        assertNotNull(result);
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void getUserNotifications_ReturnsList() {
        when(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(notification));

        List<Notification> results = notificationService.getUserNotifications(1L);

        assertEquals(1, results.size());
    }

    @Test
    void getUnreadNotifications_ReturnsList() {
        when(notificationRepository.findByRecipientIdAndIsReadFalse(1L))
                .thenReturn(List.of(notification));

        List<Notification> results = notificationService.getUnreadNotifications(1L);

        assertEquals(1, results.size());
    }

    @Test
    void markAsRead_Success() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));

        notificationService.markAsRead(1L);

        assertTrue(notification.isRead());
        verify(notificationRepository).save(notification);
    }

    @Test
    void markWorkspaceNotificationsAsRead_Success() {
        when(notificationRepository.findUnreadMentionsByWorkspace(1L, 1L))
                .thenReturn(List.of(notification));

        notificationService.markWorkspaceNotificationsAsRead(1L, 1L);

        assertTrue(notification.isRead());
        verify(notificationRepository).saveAll(any());
    }

    @Test
    void markChannelNotificationsAsRead_Success() {
        when(notificationRepository.findUnreadMentionsByChannel(1L, 1L))
                .thenReturn(List.of(notification));

        notificationService.markChannelNotificationsAsRead(1L, 1L);

        assertTrue(notification.isRead());
        verify(notificationRepository).saveAll(any());
    }

    @Test
    void markDMNotificationsAsRead_Success() {
        when(notificationRepository.findUnreadDMsBySender(1L, 2L))
                .thenReturn(List.of(notification));

        notificationService.markDMNotificationsAsRead(1L, 2L);

        assertTrue(notification.isRead());
        verify(notificationRepository).saveAll(any());
    }

    @Test
    void markRelatedNotificationsAsRead_Success() {
        when(notificationRepository.findByRecipientIdAndTypeAndRelatedEntityIdAndIsReadFalse(1L, "MENTION", 1L))
                .thenReturn(List.of(notification));

        notificationService.markRelatedNotificationsAsRead(1L, "MENTION", 1L);

        assertTrue(notification.isRead());
        verify(notificationRepository).saveAll(anyList());
    }

    @Test
    void markRelatedNotificationsAsReadForAll_Success() {
        when(notificationRepository.findByTypeAndRelatedEntityIdAndIsReadFalse("MEETING_INVITE", 1L))
                .thenReturn(List.of(notification));

        notificationService.markRelatedNotificationsAsReadForAll("MEETING_INVITE", 1L);

        assertTrue(notification.isRead());
        verify(notificationRepository).saveAll(anyList());
    }
}
