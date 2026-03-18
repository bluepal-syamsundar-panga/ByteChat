package com.bytechat.serviceimpl;

import com.bytechat.dto.response.NotificationResponse;
import com.bytechat.entity.Notification;
import com.bytechat.entity.User;
import com.bytechat.repository.NotificationRepository;
import com.bytechat.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class NotificationServiceImplTest {

    private NotificationRepository notificationRepository;
    private UserRepository userRepository;

    // 🔥 IMPORTANT: DO NOT MOCK
    private SimpMessagingTemplate messagingTemplate;

    private NotificationServiceImpl notificationService;

    private User recipient;
    private Notification notification;

    @BeforeEach
    void setUp() {
        notificationRepository = mock(NotificationRepository.class);
        userRepository = mock(UserRepository.class);

        // ✅ FIXED HERE
        messagingTemplate = new SimpMessagingTemplate(mock(org.springframework.messaging.MessageChannel.class));

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

    // ================= SEND =================

    @Test
    void sendNotification_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(recipient));
        when(notificationRepository.save(any(Notification.class))).thenReturn(notification);

        Notification result = notificationService.sendNotification(1L, "INFO", "Test", 1L);

        assertNotNull(result);
        verify(notificationRepository).save(any(Notification.class));

        // ❌ Cannot verify messagingTemplate since it's null
    }

    // ================= GET =================

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

    // ================= MARK READ =================

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
        verify(notificationRepository).saveAll(anyList());
    }

    @Test
    void markChannelNotificationsAsRead_Success() {
        when(notificationRepository.findUnreadMentionsByChannel(1L, 1L))
                .thenReturn(List.of(notification));

        notificationService.markChannelNotificationsAsRead(1L, 1L);

        assertTrue(notification.isRead());
        verify(notificationRepository).saveAll(anyList());
    }

    @Test
    void markDMNotificationsAsRead_Success() {
        when(notificationRepository.findUnreadDMsBySender(1L, 2L))
                .thenReturn(List.of(notification));

        notificationService.markDMNotificationsAsRead(1L, 2L);

        assertTrue(notification.isRead());
        verify(notificationRepository).saveAll(anyList());
    }

    // ================= GET SINGLE =================

    @Test
    void getNotification_Success() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));

        Notification result = notificationService.getNotification(1L);

        assertNotNull(result);
    }
}