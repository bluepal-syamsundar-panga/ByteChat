package com.bytechat.controllers;

import com.bytechat.dto.response.ApiResponse;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.entity.Message;
import com.bytechat.entity.Reaction;
import com.bytechat.entity.User;
import com.bytechat.repository.MessageRepository;
import com.bytechat.services.MessageService;
import com.bytechat.services.ReactionService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api/messages/{messageId}/reactions")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Reactions", description = "Endpoints for managing emoji reactions to messages")
@SecurityRequirement(name = "Bearer Authentication")
public class ReactionController {

    private final ReactionService reactionService;
    private final MessageService messageService;
    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Operation(summary = "Add reaction", description = "Adds an emoji reaction to a specific message.")
    @PostMapping
    public ResponseEntity<ApiResponse<MessageResponse>> addReaction(
            @Parameter(description = "ID of the message to react to") @PathVariable(name = "messageId") Long messageId,
            @Parameter(description = "Emoji character or shortcode") @RequestParam(name = "emoji") String emoji,
            @AuthenticationPrincipal User currentUser) {
        log.info("User {} adding reaction {} to message {}", currentUser.getId(), emoji, messageId);
        try {
            reactionService.addReaction(messageId, currentUser.getId(), emoji);
            
            // Get full updated message response
            Message message = messageRepository.findById(messageId)
                    .orElseThrow(() -> new RuntimeException("Message not found"));
            MessageResponse response = messageService.getMessageResponse(messageId, currentUser);
            
            if (response != null) {
                // Broadcast update
                if (response.getChannelId() != null) {
                    messagingTemplate.convertAndSend("/topic/channel/" + response.getChannelId(), response);
                } else if (response.getRoomId() != null) {
                    messagingTemplate.convertAndSend("/topic/room/" + response.getRoomId(), response);
                }
            }

            return ResponseEntity.ok(ApiResponse.success(response, "Reaction toggled"));
        } catch (Exception e) {
            log.error("Error toggling reaction: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @Operation(summary = "Remove reaction", description = "Removes a specific emoji reaction from a message.")
    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> removeReaction(
            @Parameter(description = "ID of the message") @PathVariable(name = "messageId") Long messageId,
            @Parameter(description = "Emoji to remove") @RequestParam(name = "emoji") String emoji,
            @AuthenticationPrincipal User currentUser) {
        log.info("User {} removing reaction {} from message {}", currentUser.getId(), emoji, messageId);
        try {
            reactionService.removeReaction(messageId, currentUser.getId(), emoji);
            return ResponseEntity.ok(ApiResponse.success(null, "Reaction removed"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @Operation(summary = "Get message reactions", description = "Retrieves all reactions for a specific message.")
    @GetMapping
    public ResponseEntity<ApiResponse<List<Reaction>>> getReactions(
            @Parameter(description = "ID of the message") @PathVariable(name = "messageId") Long messageId) {
        List<Reaction> reactions = reactionService.getReactionsForMessage(messageId);
        return ResponseEntity.ok(ApiResponse.success(reactions, "Reactions retrieved"));
    }
}
