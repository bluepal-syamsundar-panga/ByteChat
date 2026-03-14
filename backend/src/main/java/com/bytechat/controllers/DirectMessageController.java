package com.bytechat.controllers;

import com.bytechat.dto.response.ApiResponse;
import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.entity.User;
import com.bytechat.services.DirectMessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dm")
@RequiredArgsConstructor
@Slf4j
public class DirectMessageController {

    private final DirectMessageService dmService;

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<Page<MessageResponse>>> getDirectMessages(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal User currentUser) {
        log.info("Fetching direct messages between current user {} and user ID: {}", currentUser.getId(), userId);
        Page<MessageResponse> messages = dmService.getDirectMessages(userId, page, size, currentUser);
        return ResponseEntity.ok(ApiResponse.success(messages, "DMs fetched successfully"));
    }

    @PostMapping("/{userId}")
    public ResponseEntity<ApiResponse<MessageResponse>> sendDirectMessage(
            @PathVariable Long userId,
            @Valid @RequestBody MessageRequest request,
            @AuthenticationPrincipal User currentUser) {
        log.info("Sending direct message from current user {} to user ID: {}", currentUser.getId(), userId);
        MessageResponse response = dmService.sendDirectMessage(userId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "DM sent successfully"));
    }

    @PostMapping("/{userId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long userId,
            @AuthenticationPrincipal User currentUser) {
        dmService.markAsRead(userId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Messages marked as read"));
    }
}
