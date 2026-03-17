package com.bytechat.controllers;

import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.ApiResponse;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.entity.User;
import com.bytechat.services.DirectMessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/dm")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Direct Messages", description = "Endpoints for managing direct messages between users")
public class DirectMessageController {

    private final DirectMessageService directMessageService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/{otherUserId}")
    public ResponseEntity<ApiResponse<Page<MessageResponse>>> getDirectMessages(
            @PathVariable(name = "otherUserId") Long otherUserId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size,
            @AuthenticationPrincipal User currentUser) {
        log.info("Fetching DMs for user {} by user {}", otherUserId, currentUser.getEmail());
        Page<MessageResponse> messages = directMessageService.getDirectMessages(otherUserId, page, size, currentUser);
        return ResponseEntity.ok(ApiResponse.success(messages, "DMs fetched successfully"));
    }

    @PostMapping("/{otherUserId}")
    public ResponseEntity<ApiResponse<MessageResponse>> sendDirectMessage(
            @PathVariable(name = "otherUserId") Long otherUserId,
            @Valid @RequestBody MessageRequest request,
            @AuthenticationPrincipal User currentUser) {
        MessageResponse response = directMessageService.sendDirectMessage(otherUserId, request, currentUser);
        
        // Broadcast to both sender and receiver
        messagingTemplate.convertAndSend("/topic/dm/" + otherUserId, response);
        messagingTemplate.convertAndSend("/topic/dm/" + currentUser.getId(), response);
        
        return ResponseEntity.ok(ApiResponse.success(response, "DM sent successfully"));
    }

    @PutMapping("/{dmId}")
    public ResponseEntity<ApiResponse<MessageResponse>> editMessage(
            @PathVariable(name = "dmId") Long dmId,
            @Valid @RequestBody MessageRequest request,
            @AuthenticationPrincipal User currentUser) {
        MessageResponse response = directMessageService.editMessage(dmId, request.getContent(), currentUser);
        broadcastUpdate(response, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "DM edited successfully"));
    }

    @DeleteMapping("/{dmId}")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
            @PathVariable(name = "dmId") Long dmId,
            @AuthenticationPrincipal User currentUser) {
        MessageResponse response = directMessageService.deleteMessage(dmId, currentUser);
        broadcastUpdate(response, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "DM deleted successfully"));
    }

    @PostMapping("/{dmId}/pin")
    public ResponseEntity<ApiResponse<MessageResponse>> pinMessage(
            @PathVariable(name = "dmId") Long dmId,
            @AuthenticationPrincipal User currentUser) {
        MessageResponse response = directMessageService.pinMessage(dmId, currentUser);
        broadcastUpdate(response, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "DM pin toggled"));
    }

    @PostMapping("/{dmId}/react")
    public ResponseEntity<ApiResponse<MessageResponse>> reactToMessage(
            @PathVariable(name = "dmId") Long dmId,
            @RequestParam(name = "emoji") String emoji,
            @AuthenticationPrincipal User currentUser) {
        MessageResponse response = directMessageService.reactToMessage(dmId, emoji, currentUser);
        broadcastUpdate(response, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "DM reaction toggled"));
    }

    @PostMapping("/{otherUserId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable(name = "otherUserId") Long otherUserId,
            @AuthenticationPrincipal User currentUser) {
        directMessageService.markAsRead(otherUserId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "DMs marked as read"));
    }

    private void broadcastUpdate(MessageResponse response, Long currentUserId) {
        // In DMs, we broadcast to the "other" user and ourselves.
        // The service response usually doesn't have the explicit otherUserId easily reachable in this simplified structure,
        // but we can infer from sender/room ID or just using senderId vs recipient logic.
        // For simplicity, we broadcast to senderId topic and a generic update topic if needed, 
        // but DMChatWindow subscribes to /topic/dm/{myId}.
        
        // We'll broadcast to the sender's own topic 
        messagingTemplate.convertAndSend("/topic/dm/" + currentUserId, response);
        
        // And we need to notify the other person in the DM. 
        // For now, let's assume we can get it from the message sender/receiver.
        // (This might require more logic if we don't have recipientId in MessageResponse)
    }
}
