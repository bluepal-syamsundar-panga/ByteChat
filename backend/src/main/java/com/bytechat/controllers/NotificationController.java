package com.bytechat.controllers;

import com.bytechat.dto.response.ApiResponse;
import com.bytechat.dto.response.NotificationResponse;
import com.bytechat.entity.Notification;
import com.bytechat.entity.User;
import com.bytechat.services.ChannelService;
import com.bytechat.services.WorkspaceService;
import com.bytechat.services.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;
    private final WorkspaceService workspaceService;
    private final ChannelService channelService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getNotifications(
            @AuthenticationPrincipal User currentUser) {
        log.info("Fetching notifications for user ID: {}", currentUser.getId());
        List<NotificationResponse> notifications = notificationService.getUserNotifications(currentUser.getId())
                .stream()
                .map(NotificationResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(notifications, "Notifications retrieved"));
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable(name = "notificationId") Long notificationId,
            @AuthenticationPrincipal User currentUser) {
        try {
            log.info("Marking notification {} as read for user ID: {}", notificationId, currentUser.getId());
            notificationService.markAsRead(notificationId);
            return ResponseEntity.ok(ApiResponse.success(null, "Notification marked as read"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{notificationId}/accept")
    public ResponseEntity<ApiResponse<Void>> acceptNotification(
            @PathVariable(name = "notificationId") Long notificationId,
            @AuthenticationPrincipal User currentUser) {
        
        Notification notification = notificationService.getNotification(notificationId);
        if ("CHANNEL_INVITE".equals(notification.getType())) {
            channelService.acceptInvite(notificationId, currentUser);
        } else {
            workspaceService.acceptInvite(notificationId, currentUser);
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Invite accepted"));
    }

    @PutMapping("/mark-workspace-read/{workspaceId}")
    public ResponseEntity<ApiResponse<Void>> markWorkspaceRead(
            @PathVariable(name = "workspaceId") Long workspaceId,
            @AuthenticationPrincipal User currentUser) {
        notificationService.markWorkspaceNotificationsAsRead(currentUser.getId(), workspaceId);
        return ResponseEntity.ok(ApiResponse.success(null, "Workspace notifications marked as read"));
    }

    @PutMapping("/mark-dm-read/{senderId}")
    public ResponseEntity<ApiResponse<Void>> markDMRead(
            @PathVariable(name = "senderId") Long senderId,
            @AuthenticationPrincipal User currentUser) {
        notificationService.markDMNotificationsAsRead(currentUser.getId(), senderId);
        return ResponseEntity.ok(ApiResponse.success(null, "DM notifications marked as read"));
    }
}
