package com.bytechat.controllers;

import com.bytechat.dto.response.ApiResponse;
import com.bytechat.dto.response.NotificationResponse;
import com.bytechat.entity.User;
import com.bytechat.services.RoomService;
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
    private final RoomService roomService;

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
        roomService.acceptInvite(notificationId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Invite accepted"));
    }
}
