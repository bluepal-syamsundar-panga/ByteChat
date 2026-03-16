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
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Messages", description = "Endpoints for sending, editing, and retrieving room messages")
public class MessageController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/channel/{channelId}") 
    @Operation(summary = "Get channel messages", description = "Retrieves a paginated list of messages for a specific channel.")
    public ResponseEntity<ApiResponse<Page<MessageResponse>>> getChannelMessages(
            @PathVariable(name = "channelId") Long channelId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size,
            @AuthenticationPrincipal User currentUser) {
        log.info("Fetching messages for channel ID: {}", channelId);
        Page<MessageResponse> messages = messageService.getRoomMessages(channelId, page, size, currentUser);
        return ResponseEntity.ok(ApiResponse.success(messages, "Messages fetched successfully"));
    }

    @PostMapping("/channel/{channelId}")
    @Operation(summary = "Send message", description = "Sends a new message to the specified channel.")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @PathVariable(name = "channelId") Long channelId,
            @Valid @RequestBody MessageRequest request,
            @AuthenticationPrincipal User currentUser) {
        log.info("Sending message to channel ID: {}", channelId);
        MessageResponse response = messageService.sendMessage(channelId, request, currentUser);
        
        // Broadcast via WebSocket
        messagingTemplate.convertAndSend("/topic/channel/" + channelId, response);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Message sent successfully"));
    }

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

    @DeleteMapping("/{messageId}")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
            @PathVariable(name = "messageId") Long messageId,
            @AuthenticationPrincipal User currentUser) {
        log.info("Deleting message with ID: {}", messageId);
        MessageResponse response = messageService.deleteMessage(messageId, currentUser);
        
        // Broadcast update to channel topic
        if (response.getChannelId() != null) {
            messagingTemplate.convertAndSend("/topic/channel/" + response.getChannelId(), response);
        } else if (response.getRoomId() != null) {
            messagingTemplate.convertAndSend("/topic/room/" + response.getRoomId(), response);
        }
        
        return ResponseEntity.ok(ApiResponse.success(null, "Message deleted successfully"));
    }

    @PostMapping("/{messageId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable(name = "messageId") Long messageId,
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
}
