package com.bytechat.services;

import com.bytechat.entity.Notification;

import java.util.List;

public interface NotificationService {
    Notification sendNotification(Long recipientId, String type, String content, Long relatedEntityId);
    List<Notification> getUserNotifications(Long userId);
    List<Notification> getUnreadNotifications(Long userId);
    void markAsRead(Long notificationId);
    void markRoomNotificationsAsRead(Long userId, Long roomId);
    void markDMNotificationsAsRead(Long userId, Long senderId);
}
