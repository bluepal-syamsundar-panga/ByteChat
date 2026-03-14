package com.bytechat.controllers;

import com.bytechat.dto.response.ApiResponse;
import com.bytechat.entity.Reaction;
import com.bytechat.entity.User;
import com.bytechat.services.ReactionService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/messages/{messageId}/reactions")
@RequiredArgsConstructor
@Slf4j
public class ReactionController {

    private final TypingController typingController;

    private final ReactionService reactionService;

    @PostMapping
    public ResponseEntity<ApiResponse<Reaction>> addReaction(
            @PathVariable Long messageId,
            @RequestParam String emoji,
            @AuthenticationPrincipal User currentUser) {
        log.info("User {} adding reaction {} to message {}", currentUser.getId(), emoji, messageId);
        // The original snippet had a syntax error here. Correcting based on common patterns.
        // The @AuthenticationPrincipal handles null users by throwing an exception,
        // so the explicit null check for currentUser is removed.
        // The try-catch block is also typically handled by a global exception handler in Spring.
        // For this specific instruction, I will keep the try-catch as it was in the original,
        // but adapt it to the new parameters.
        try {
            Reaction reaction = reactionService.addReaction(messageId, currentUser.getId(), emoji);
            return ResponseEntity.ok(ApiResponse.success(reaction, "Reaction added"));
        } catch (Exception e) {
            log.error("Error adding reaction: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> removeReaction(
            @PathVariable Long messageId,
            @RequestParam String emoji,
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
    public ResponseEntity<ApiResponse<List<Reaction>>> getReactions(@PathVariable Long messageId) {
        List<Reaction> reactions = reactionService.getReactionsForMessage(messageId);
        return ResponseEntity.ok(ApiResponse.success(reactions, "Reactions retrieved"));
    }
}
