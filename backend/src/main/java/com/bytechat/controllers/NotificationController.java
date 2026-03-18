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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Notifications", description = "Endpoints for managing user notifications")
@SecurityRequirement(name = "Bearer Authentication")
public class NotificationController {

    private final NotificationService notificationService;
    private final WorkspaceService workspaceService;
    private final ChannelService channelService;

    @Operation(summary = "Get user notifications", description = "Retrieves a list of all notifications for the current user.")
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

    @Operation(summary = "Mark notification as read", description = "Marks a specific notification as read.")
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @Parameter(description = "ID of the notification to mark as read") @PathVariable(name = "notificationId") Long notificationId,
            @AuthenticationPrincipal User currentUser) {
        try {
            log.info("Marking notification {} as read for user ID: {}", notificationId, currentUser.getId());
            notificationService.markAsRead(notificationId);
            return ResponseEntity.ok(ApiResponse.success(null, "Notification marked as read"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @Operation(summary = "Accept invitation", description = "Accepts a workspace or channel invitation notification.")
    @PostMapping("/{notificationId}/accept")
    public ResponseEntity<ApiResponse<Void>> acceptNotification(
            @Parameter(description = "ID of the notification containing the invitation") @PathVariable(name = "notificationId") Long notificationId,
            @AuthenticationPrincipal User currentUser) {
        
        Notification notification = notificationService.getNotification(notificationId);
        if ("CHANNEL_INVITE".equals(notification.getType())) {
            channelService.acceptInvite(notificationId, currentUser);
        } else {
            workspaceService.acceptInvite(notificationId, currentUser);
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Invite accepted"));
    }

    @Operation(summary = "Mark workspace notifications as read", description = "Marks all notifications for a specific workspace as read.")
    @PutMapping("/mark-workspace-read/{workspaceId}")
    public ResponseEntity<ApiResponse<Void>> markWorkspaceRead(
            @Parameter(description = "ID of the workspace") @PathVariable(name = "workspaceId") Long workspaceId,
            @AuthenticationPrincipal User currentUser) {
        notificationService.markWorkspaceNotificationsAsRead(currentUser.getId(), workspaceId);
        return ResponseEntity.ok(ApiResponse.success(null, "Workspace notifications marked as read"));
    }

    @Operation(summary = "Mark channel notifications as read", description = "Marks all notifications for a specific channel as read.")
    @PutMapping("/mark-room-read/{channelId}")
    public ResponseEntity<ApiResponse<Void>> markRoomRead(
            @Parameter(description = "ID of the channel") @PathVariable(name = "channelId") Long channelId,
            @AuthenticationPrincipal User currentUser) {
        notificationService.markChannelNotificationsAsRead(currentUser.getId(), channelId);
        return ResponseEntity.ok(ApiResponse.success(null, "Channel notifications marked as read"));
    }

    @Operation(summary = "Mark DM notifications as read", description = "Marks all direct message notifications from a specific sender as read.")
    @PutMapping("/mark-dm-read/{senderId}")
    public ResponseEntity<ApiResponse<Void>> markDMRead(
            @Parameter(description = "ID of the user who sent the direct messages") @PathVariable(name = "senderId") Long senderId,
            @AuthenticationPrincipal User currentUser) {
        notificationService.markDMNotificationsAsRead(currentUser.getId(), senderId);
        return ResponseEntity.ok(ApiResponse.success(null, "DM notifications marked as read"));
    }
}
