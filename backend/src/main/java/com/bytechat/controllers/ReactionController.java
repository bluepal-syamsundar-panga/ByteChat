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

@RestController
@RequestMapping("/api/messages/{messageId}/reactions")
@RequiredArgsConstructor
@Slf4j
public class ReactionController {

    private final ReactionService reactionService;
    private final MessageService messageService;
    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping
    public ResponseEntity<ApiResponse<MessageResponse>> addReaction(
            @PathVariable(name = "messageId") Long messageId,
            @RequestParam(name = "emoji") String emoji,
            @AuthenticationPrincipal User currentUser) {
        log.info("User {} adding reaction {} to message {}", currentUser.getId(), emoji, messageId);
        // The original snippet had a syntax error here. Correcting based on common patterns.
        // The @AuthenticationPrincipal handles null users by throwing an exception,
        // so the explicit null check for currentUser is removed.
        // The try-catch block is also typically handled by a global exception handler in Spring.
        // For this specific instruction, I will keep the try-catch as it was in the original,
        // but adapt it to the new parameters.
        try {
            reactionService.addReaction(messageId, currentUser.getId(), emoji);
            
            // Get full updated message response
            Message message = messageRepository.findById(messageId)
                    .orElseThrow(() -> new RuntimeException("Message not found"));
            MessageResponse response = messageService.getRoomMessages(message.getChannel().getId(), 0, 1, currentUser)
                    .getContent().stream()
                    .filter(m -> m.getId().equals(messageId))
                    .findFirst()
                    .orElse(null);
            
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

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> removeReaction(
            @PathVariable(name = "messageId") Long messageId,
            @RequestParam(name = "emoji") String emoji,
            @AuthenticationPrincipal User currentUser) {
        log.info("User {} removing reaction {} from message {}", currentUser.getId(), emoji, messageId);
        // Similar correction for removeReaction based on the provided snippet and common patterns.
        try {
            reactionService.removeReaction(messageId, currentUser.getId(), emoji);
            return ResponseEntity.ok(ApiResponse.success(null, "Reaction removed"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Reaction>>> getReactions(@PathVariable(name = "messageId") Long messageId) {
        List<Reaction> reactions = reactionService.getReactionsForMessage(messageId);
        return ResponseEntity.ok(ApiResponse.success(reactions, "Reactions retrieved"));
    }
}
