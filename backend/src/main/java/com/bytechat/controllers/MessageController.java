package com.bytechat.controllers;

import com.bytechat.dto.response.ApiResponse;
import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.entity.User;
import com.bytechat.services.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/messages") // Changed from "/api"
@RequiredArgsConstructor
@Slf4j // Added Slf4j annotation
@Tag(name = "Messages", description = "Endpoints for sending, editing, and retrieving room messages")
public class MessageController {

    private final MessageService messageService;

    // Get messages for a room
    @GetMapping("/room/{roomId}") 
    @Operation(summary = "Get room messages", description = "Retrieves a paginated list of messages for a specific room.")
    public ResponseEntity<ApiResponse<Page<MessageResponse>>> getRoomMessages(
            @PathVariable Long roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal User currentUser) {
        log.info("Fetching messages for room ID: {}", roomId);
        Page<MessageResponse> messages = messageService.getRoomMessages(roomId, page, size, currentUser);
        return ResponseEntity.ok(ApiResponse.success(messages, "Messages fetched successfully"));
    }

    // Send message (New method based on the provided edit)
    @PostMapping("/room/{roomId}")
    @Operation(summary = "Send message", description = "Sends a new message to the specified room.")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @PathVariable Long roomId,
            @Valid @RequestBody MessageRequest request,
            @AuthenticationPrincipal User currentUser) { // Added currentUser for consistency
        log.info("Sending message to room ID: {}", roomId); // Added logging
        // Assuming messageService.sendMessage exists and takes these parameters
        MessageResponse response = messageService.sendMessage(roomId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Message sent successfully"));
    }

    // Edit message
    @PutMapping("/{messageId}") // Changed from "/messages/{messageId}"
    public ResponseEntity<ApiResponse<MessageResponse>> editMessage(
            @PathVariable Long messageId,
            @Valid @RequestBody MessageRequest request,
            @AuthenticationPrincipal User currentUser) {
        log.info("Editing message with ID: {}", messageId); // Added logging
        MessageResponse response = messageService.editMessage(messageId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Message edited successfully"));
    }

    // Delete message
    @DeleteMapping("/{messageId}") // Changed from "/messages/{messageId}"
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
            @PathVariable Long messageId,
            @AuthenticationPrincipal User currentUser) {
        messageService.deleteMessage(messageId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Message deleted successfully"));
    }

    // Pin message
    @PostMapping("/{messageId}/pin")
    @Operation(summary = "Pin/Unpin message", description = "Toggles the pinned status of a message.")
    public ResponseEntity<ApiResponse<MessageResponse>> pinMessage(
            @PathVariable Long messageId,
            @AuthenticationPrincipal User currentUser) {
        MessageResponse response = messageService.pinMessage(messageId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Message pin toggled"));
    }
}
