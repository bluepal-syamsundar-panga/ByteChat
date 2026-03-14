package com.bytechat.controllers;

import com.bytechat.dto.response.ApiResponse;
import com.bytechat.entity.Notification;
import com.bytechat.entity.User;
import com.bytechat.services.NotificationService;
import com.bytechat.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getNotifications() {
        User currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        List<Notification> notifications = notificationService.getUserNotifications(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(notifications, "Notifications retrieved"));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<String>> markAsRead(@PathVariable Long id) {
        try {
            notificationService.markAsRead(id);
            return ResponseEntity.ok(ApiResponse.success(null, "Notification marked as read"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
