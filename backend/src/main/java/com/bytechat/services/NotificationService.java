package com.bytechat.services;

import com.bytechat.entity.Notification;

import java.util.List;

public interface NotificationService {
    Notification sendNotification(Long recipientId, String type, String content, Long relatedEntityId);
    List<Notification> getUserNotifications(Long userId);
    List<Notification> getUnreadNotifications(Long userId);
    void markAsRead(Long notificationId);
    void markWorkspaceNotificationsAsRead(Long userId, Long workspaceId);
    void markChannelNotificationsAsRead(Long userId, Long channelId);
    void markDMNotificationsAsRead(Long userId, Long senderId);
    Notification getNotification(Long notificationId);
}
