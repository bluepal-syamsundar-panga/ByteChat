package com.bytechat.controllers;

import com.bytechat.dto.request.CreateGroupConversationRequest;
import com.bytechat.dto.request.GroupConversationInviteRequest;
import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.ApiResponse;
import com.bytechat.dto.response.GroupConversationInviteResponse;
import com.bytechat.dto.response.GroupConversationResponse;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.entity.User;
import com.bytechat.repository.GroupConversationMemberRepository;
import com.bytechat.services.GroupConversationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/group-dm")
@RequiredArgsConstructor
@Tag(name = "Group Direct Messages", description = "Endpoints for private group direct messages")
@io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "Bearer Authentication")
public class GroupConversationController {
    private final GroupConversationService groupConversationService;
    private final GroupConversationMemberRepository groupConversationMemberRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping
    @Operation(summary = "Create group DM")
    public ResponseEntity<ApiResponse<GroupConversationResponse>> createConversation(
            @Valid @RequestBody CreateGroupConversationRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(groupConversationService.createConversation(request, currentUser), "Group conversation created"));
    }

    @GetMapping
    @Operation(summary = "Get user groups")
    public ResponseEntity<ApiResponse<List<GroupConversationResponse>>> getUserGroups(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(groupConversationService.getUserGroups(currentUser), "Group conversations fetched"));
    }

    @GetMapping("/{groupId}")
    @Operation(summary = "Get group conversation")
    public ResponseEntity<ApiResponse<GroupConversationResponse>> getConversation(
            @PathVariable Long groupId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(groupConversationService.getConversation(groupId, currentUser), "Group conversation fetched"));
    }

    @GetMapping("/invites")
    @Operation(summary = "Get pending group invites")
    public ResponseEntity<ApiResponse<List<GroupConversationInviteResponse>>> getPendingInvites(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(groupConversationService.getPendingInvites(currentUser), "Pending group invites fetched"));
    }

    @PostMapping("/invites/{inviteId}/accept")
    @Operation(summary = "Accept group invite")
    public ResponseEntity<ApiResponse<GroupConversationInviteResponse>> acceptInvite(
            @PathVariable Long inviteId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(groupConversationService.acceptInvite(inviteId, currentUser), "Group invite accepted"));
    }

    @PostMapping("/invites/{inviteId}/reject")
    @Operation(summary = "Reject group invite")
    public ResponseEntity<ApiResponse<Void>> rejectInvite(
            @PathVariable Long inviteId,
            @AuthenticationPrincipal User currentUser) {
        groupConversationService.rejectInvite(inviteId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Group invite rejected"));
    }

    @PostMapping("/{groupId}/invite")
    @Operation(summary = "Invite members to group DM")
    public ResponseEntity<ApiResponse<GroupConversationResponse>> inviteMembers(
            @PathVariable Long groupId,
            @Valid @RequestBody GroupConversationInviteRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(groupConversationService.inviteMembers(groupId, request, currentUser), "Group members invited"));
    }

    @PostMapping("/{groupId}/leave")
    @Operation(summary = "Leave group DM")
    public ResponseEntity<ApiResponse<Void>> leaveConversation(
            @PathVariable Long groupId,
            @AuthenticationPrincipal User currentUser) {
        groupConversationService.leaveConversation(groupId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Left group conversation"));
    }

    @DeleteMapping("/{groupId}")
    @Operation(summary = "Delete group DM")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            @PathVariable Long groupId,
            @AuthenticationPrincipal User currentUser) {
        groupConversationService.deleteConversation(groupId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Group conversation deleted"));
    }

    @DeleteMapping("/{groupId}/members/{userId}")
    @Operation(summary = "Remove member from group DM")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable Long groupId,
            @PathVariable Long userId,
            @AuthenticationPrincipal User currentUser) {
        groupConversationService.removeMember(groupId, userId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Group member removed"));
    }

    @GetMapping("/{groupId}/messages")
    @Operation(summary = "Get group messages")
    public ResponseEntity<ApiResponse<Page<MessageResponse>>> getMessages(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(groupConversationService.getMessages(groupId, page, size, currentUser), "Group messages fetched"));
    }

    @PostMapping("/{groupId}/messages")
    @Operation(summary = "Send group message")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @PathVariable Long groupId,
            @Valid @RequestBody MessageRequest request,
            @AuthenticationPrincipal User currentUser) {
        MessageResponse response = groupConversationService.sendMessage(groupId, request, currentUser);
        broadcastToGroup(groupId, response);
        return ResponseEntity.ok(ApiResponse.success(response, "Group message sent"));
    }

    @PutMapping("/messages/{messageId}")
    @Operation(summary = "Edit group message")
    public ResponseEntity<ApiResponse<MessageResponse>> editMessage(
            @PathVariable Long messageId,
            @Valid @RequestBody MessageRequest request,
            @AuthenticationPrincipal User currentUser) {
        MessageResponse response = groupConversationService.editMessage(messageId, request.getContent(), currentUser);
        broadcastToGroup(response.getGroupId(), response);
        return ResponseEntity.ok(ApiResponse.success(response, "Group message edited"));
    }

    @DeleteMapping("/messages/{messageId}")
    @Operation(summary = "Delete group message")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
            @PathVariable Long messageId,
            @RequestParam(defaultValue = "everyone") String scope,
            @AuthenticationPrincipal User currentUser) {
        MessageResponse response = groupConversationService.deleteMessage(messageId, scope, currentUser);
        broadcastToGroup(response.getGroupId(), response);
        return ResponseEntity.ok(ApiResponse.success(null, "Group message deleted"));
    }

    @PostMapping("/messages/{messageId}/pin")
    @Operation(summary = "Pin group message")
    public ResponseEntity<ApiResponse<MessageResponse>> pinMessage(
            @PathVariable Long messageId,
            @AuthenticationPrincipal User currentUser) {
        MessageResponse response = groupConversationService.pinMessage(messageId, currentUser);
        broadcastToGroup(response.getGroupId(), response);
        return ResponseEntity.ok(ApiResponse.success(response, "Group message pin toggled"));
    }

    @PostMapping("/messages/{messageId}/react")
    @Operation(summary = "React to group message")
    public ResponseEntity<ApiResponse<MessageResponse>> reactToMessage(
            @PathVariable Long messageId,
            @RequestParam String emoji,
            @AuthenticationPrincipal User currentUser) {
        MessageResponse response = groupConversationService.reactToMessage(messageId, emoji, currentUser);
        broadcastToGroup(response.getGroupId(), response);
        return ResponseEntity.ok(ApiResponse.success(response, "Group reaction toggled"));
    }

    @PostMapping("/{groupId}/read")
    @Operation(summary = "Mark group as read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long groupId,
            @AuthenticationPrincipal User currentUser) {
        groupConversationService.markAsRead(groupId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Group conversation marked as read"));
    }

    private void broadcastToGroup(Long groupId, MessageResponse response) {
        groupConversationMemberRepository.findByGroupConversationId(groupId).forEach(member ->
                messagingTemplate.convertAndSend("/topic/group-dm/" + member.getUser().getId(), response)
        );
    }
}
