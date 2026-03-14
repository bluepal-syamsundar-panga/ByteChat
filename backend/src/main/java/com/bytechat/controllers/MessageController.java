package com.bytechat.controllers;

import com.bytechat.dto.response.ApiResponse;
import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.entity.User;
import com.bytechat.services.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    // Get messages for a room
    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<ApiResponse<Page<MessageResponse>>> getRoomMessages(
            @PathVariable Long roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal User currentUser) {
        Page<MessageResponse> messages = messageService.getRoomMessages(roomId, page, size, currentUser);
        return ResponseEntity.ok(ApiResponse.success(messages, "Messages fetched successfully"));
    }

    // Edit message
    @PutMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<MessageResponse>> editMessage(
            @PathVariable Long messageId,
            @Valid @RequestBody MessageRequest request,
            @AuthenticationPrincipal User currentUser) {
        MessageResponse response = messageService.editMessage(messageId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Message edited successfully"));
    }

    // Delete message
    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
            @PathVariable Long messageId,
            @AuthenticationPrincipal User currentUser) {
        messageService.deleteMessage(messageId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Message deleted successfully"));
    }

    // Pin message
    @PostMapping("/messages/{messageId}/pin")
    public ResponseEntity<ApiResponse<MessageResponse>> pinMessage(
            @PathVariable Long messageId,
            @AuthenticationPrincipal User currentUser) {
        MessageResponse response = messageService.pinMessage(messageId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Message pin toggled"));
    }
}
