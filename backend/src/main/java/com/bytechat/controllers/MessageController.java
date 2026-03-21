package com.bytechat.controllers;

import com.bytechat.dto.response.ApiResponse;
import com.bytechat.dto.response.CursorPageResponse;
import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.entity.User;
import com.bytechat.services.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Messages", description = "Endpoints for sending, editing, and retrieving room messages")
@io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "Bearer Authentication")
public class MessageController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/channel/{channelId}") 
    @Operation(summary = "Get channel messages", description = "Retrieves a paginated list of messages for a specific channel.")
    public ResponseEntity<ApiResponse<CursorPageResponse<MessageResponse>>> getChannelMessages(
            @Parameter(description = "ID of the channel") @PathVariable(name = "channelId") Long channelId,
            @Parameter(description = "Fetch messages older than this timestamp") @RequestParam(name = "cursorSentAt", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime cursorSentAt,
            @Parameter(description = "Tie-breaker cursor for messages with identical timestamps") @RequestParam(name = "cursorId", required = false) Long cursorId,
            @Parameter(description = "Number of items per page") @RequestParam(name = "size", defaultValue = "50") int size,
            @AuthenticationPrincipal User currentUser) {
        log.info("Fetching messages for channel ID: {}", channelId);
        CursorPageResponse<MessageResponse> messages = messageService.getRoomMessages(channelId, cursorSentAt, cursorId, size, currentUser);
        return ResponseEntity.ok(ApiResponse.success(messages, "Messages fetched successfully"));
    }

    @PostMapping("/channel/{channelId}")
    @Operation(summary = "Send message", description = "Sends a new message to the specified channel.")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Message sent successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Unauthorized to send message to this channel")
    })
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @Parameter(description = "ID of the channel") @PathVariable(name = "channelId") Long channelId,
            @Valid @RequestBody MessageRequest request,
            @AuthenticationPrincipal User currentUser) {
        log.info("Sending message to channel ID: {}", channelId);
        MessageResponse response = messageService.sendMessage(channelId, request, currentUser);
        
        // Broadcast via WebSocket
        messagingTemplate.convertAndSend("/topic/channel/" + channelId, response);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Message sent successfully"));
    }

    @Operation(summary = "Edit message", description = "Updates the content of an existing message.")
    @PutMapping("/{messageId}")
    public ResponseEntity<ApiResponse<MessageResponse>> editMessage(
            @PathVariable(name = "messageId") Long messageId,
            @Valid @RequestBody MessageRequest request,
            @AuthenticationPrincipal User currentUser) {
        log.info("Editing message with ID: {}", messageId);
        MessageResponse response = messageService.editMessage(messageId, request, currentUser);
        
        // Broadcast update to channel topic (frontend subscribes to channel topics)
        if (response.getChannelId() != null) {
            messagingTemplate.convertAndSend("/topic/channel/" + response.getChannelId(), response);
        } else if (response.getRoomId() != null) {
            messagingTemplate.convertAndSend("/topic/room/" + response.getRoomId(), response);
        }
        
        return ResponseEntity.ok(ApiResponse.success(response, "Message edited successfully"));
    }

    @Operation(summary = "Delete message", description = "Performs a soft delete of a message.")
    @DeleteMapping("/{messageId}")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
            @PathVariable(name = "messageId") Long messageId,
            @RequestParam(name = "scope", defaultValue = "everyone") String scope,
            @AuthenticationPrincipal User currentUser) {
        log.info("Deleting message with ID: {}", messageId);
        MessageResponse response = messageService.deleteMessage(messageId, scope, currentUser);
        
        // Broadcast update to channel topic
        if (response.getChannelId() != null) {
            messagingTemplate.convertAndSend("/topic/channel/" + response.getChannelId(), response);
        } else if (response.getRoomId() != null) {
            messagingTemplate.convertAndSend("/topic/room/" + response.getRoomId(), response);
        }
        
        return ResponseEntity.ok(ApiResponse.success(null, "Message deleted successfully"));
    }

    @Operation(summary = "Mark message as read", description = "Marks a specific message as read for the current user.")
    @PostMapping("/{messageId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @Parameter(description = "ID of the message") @PathVariable(name = "messageId") Long messageId,
            @AuthenticationPrincipal User currentUser) {
        messageService.markAsRead(messageId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Message marked as read"));
    }

    @PostMapping("/{messageId}/pin")
    @Operation(summary = "Pin/Unpin message", description = "Toggles the pinned status of a message.")
    public ResponseEntity<ApiResponse<MessageResponse>> pinMessage(
            @PathVariable(name = "messageId") Long messageId,
            @AuthenticationPrincipal User currentUser) {
        log.info("Toggling pin for message ID: {}", messageId);
        MessageResponse response = messageService.pinMessage(messageId, currentUser);
        
        // Broadcast update to channel topic (frontend subscribes to channel topics)
        if (response.getChannelId() != null) {
            messagingTemplate.convertAndSend("/topic/channel/" + response.getChannelId(), response);
        } else if (response.getRoomId() != null) {
            messagingTemplate.convertAndSend("/topic/room/" + response.getRoomId(), response);
        }
        
        return ResponseEntity.ok(ApiResponse.success(response, "Message pin toggled"));
    }
    @PostMapping("/channel/{channelId}/read")
    @Operation(summary = "Mark channel as read", description = "Marks all messages in a channel as read for the current user.")
    public ResponseEntity<ApiResponse<Void>> markChannelAsRead(
            @Parameter(description = "ID of the channel") @PathVariable(name = "channelId") Long channelId,
            @AuthenticationPrincipal User currentUser) {
        log.info("Marking channel ID {} as read for user {}", channelId, currentUser.getEmail());
        messageService.markChannelAsRead(channelId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Channel marked as read"));
    }
}
