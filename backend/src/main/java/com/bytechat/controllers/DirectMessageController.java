package com.bytechat.controllers;

import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.ApiResponse;
import com.bytechat.dto.response.CursorPageResponse;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.entity.User;
import com.bytechat.services.DirectMessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/dm")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Direct Messages", description = "Endpoints for managing direct messages between users")
@io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "Bearer Authentication")
public class DirectMessageController {

    private final DirectMessageService directMessageService;
    private final SimpMessagingTemplate messagingTemplate;

    @Operation(summary = "Get direct messages", description = "Retrieves a paginated list of direct messages between the current user and another user.")
    @GetMapping("/{otherUserId}")
    public ResponseEntity<ApiResponse<CursorPageResponse<MessageResponse>>> getDirectMessages(
            @Parameter(description = "ID of the other user in the conversation") @PathVariable(name = "otherUserId") Long otherUserId,
            @Parameter(description = "Fetch messages older than this timestamp") @RequestParam(name = "cursorSentAt", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime cursorSentAt,
            @Parameter(description = "Tie-breaker cursor for messages with identical timestamps") @RequestParam(name = "cursorId", required = false) Long cursorId,
            @Parameter(description = "Number of items per page") @RequestParam(name = "size", defaultValue = "50") int size,
            @AuthenticationPrincipal User currentUser) {
        log.info("Fetching DMs for user {} by user {}", otherUserId, currentUser.getEmail());
        CursorPageResponse<MessageResponse> messages = directMessageService.getDirectMessages(otherUserId, cursorSentAt, cursorId, size, currentUser);
        return ResponseEntity.ok(ApiResponse.success(messages, "DMs fetched successfully"));
    }

    @Operation(summary = "Send direct message", description = "Sends a new direct message to another user.")
    @PostMapping("/{otherUserId}")
    public ResponseEntity<ApiResponse<MessageResponse>> sendDirectMessage(
            @Parameter(description = "ID of the recipient user") @PathVariable(name = "otherUserId") Long otherUserId,
            @Valid @RequestBody MessageRequest request,
            @AuthenticationPrincipal User currentUser) {
        MessageResponse response = directMessageService.sendDirectMessage(otherUserId, request, currentUser);
        
        // Broadcast to both sender and receiver
        messagingTemplate.convertAndSend("/topic/dm/" + otherUserId, response);
        messagingTemplate.convertAndSend("/topic/dm/" + currentUser.getId(), response);
        
        return ResponseEntity.ok(ApiResponse.success(response, "DM sent successfully"));
    }

    @Operation(summary = "Edit message", description = "Updates the content of an existing direct message.")
    @PutMapping("/{dmId}")
    public ResponseEntity<ApiResponse<MessageResponse>> editMessage(
            @Parameter(description = "ID of the direct message") @PathVariable(name = "dmId") Long dmId,
            @Valid @RequestBody MessageRequest request,
            @AuthenticationPrincipal User currentUser) {
        MessageResponse response = directMessageService.editMessage(dmId, request.getContent(), currentUser);
        broadcastUpdate(response, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "DM edited successfully"));
    }

    @Operation(summary = "Delete message", description = "Performs a soft delete of a direct message.")
    @DeleteMapping("/{dmId}")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
            @Parameter(description = "ID of the direct message") @PathVariable(name = "dmId") Long dmId,
            @RequestParam(name = "scope", defaultValue = "everyone") String scope,
            @AuthenticationPrincipal User currentUser) {
        MessageResponse response = directMessageService.deleteMessage(dmId, scope, currentUser);
        broadcastUpdate(response, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "DM deleted successfully"));
    }

    @Operation(summary = "Pin message", description = "Toggles the pinned status of a direct message.")
    @PostMapping("/{dmId}/pin")
    public ResponseEntity<ApiResponse<MessageResponse>> pinMessage(
            @Parameter(description = "ID of the direct message") @PathVariable(name = "dmId") Long dmId,
            @AuthenticationPrincipal User currentUser) {
        MessageResponse response = directMessageService.pinMessage(dmId, currentUser);
        broadcastUpdate(response, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "DM pin toggled"));
    }

    @Operation(summary = "React to message", description = "Adds or removes an emoji reaction to a direct message.")
    @PostMapping("/{dmId}/react")
    public ResponseEntity<ApiResponse<MessageResponse>> reactToMessage(
            @Parameter(description = "ID of the direct message") @PathVariable(name = "dmId") Long dmId,
            @Parameter(description = "Emoji character") @RequestParam(name = "emoji") String emoji,
            @AuthenticationPrincipal User currentUser) {
        MessageResponse response = directMessageService.reactToMessage(dmId, emoji, currentUser);
        broadcastUpdate(response, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "DM reaction toggled"));
    }

    @Operation(summary = "Mark as read", description = "Marks all direct messages from a specific user as read.")
    @PostMapping("/{otherUserId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @Parameter(description = "ID of the other user") @PathVariable(name = "otherUserId") Long otherUserId,
            @AuthenticationPrincipal User currentUser) {
        directMessageService.markAsRead(otherUserId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "DMs marked as read"));
    }

    private void broadcastUpdate(MessageResponse response, Long currentUserId) {
        messagingTemplate.convertAndSend("/topic/dm/" + response.getSenderId(), response);
        if (response.getRecipientId() != null) {
            messagingTemplate.convertAndSend("/topic/dm/" + response.getRecipientId(), response);
        } else if (currentUserId != null) {
            messagingTemplate.convertAndSend("/topic/dm/" + currentUserId, response);
        }
    }
}
