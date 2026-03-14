package com.bytechat.controllers;

import com.bytechat.dto.response.ApiResponse;
import com.bytechat.entity.Reaction;
import com.bytechat.entity.User;
import com.bytechat.services.ReactionService;
import com.bytechat.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages/{messageId}/reactions")
@RequiredArgsConstructor
public class ReactionController {

    private final ReactionService reactionService;

    @PostMapping("/{emoji}")
    public ResponseEntity<ApiResponse<Reaction>> addReaction(
            @PathVariable Long messageId,
            @PathVariable String emoji) {
        
        User currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        try {
            Reaction reaction = reactionService.addReaction(messageId, currentUser.getId(), emoji);
            return ResponseEntity.ok(ApiResponse.success(reaction, "Reaction added"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{emoji}")
    public ResponseEntity<ApiResponse<String>> removeReaction(
            @PathVariable Long messageId,
            @PathVariable String emoji) {
        
        User currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

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
