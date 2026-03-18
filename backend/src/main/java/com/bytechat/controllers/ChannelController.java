package com.bytechat.controllers;

import com.bytechat.dto.request.InviteUserRequest;
import com.bytechat.dto.response.ApiResponse;
import com.bytechat.dto.response.ChannelResponse;
import com.bytechat.dto.response.UserResponse;
import com.bytechat.entity.User;
import com.bytechat.services.ChannelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/channels")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Channels", description = "Endpoints for managing channels within a workspace")
public class ChannelController {

    private final ChannelService channelService;

    @PostMapping("/workspace/{workspaceId}")
    @Operation(summary = "Create channel", description = "Creates a new channel in a workspace.")
    public ResponseEntity<ApiResponse<ChannelResponse>> createChannel(
            @PathVariable(name = "workspaceId") Long workspaceId,
            @RequestParam(name = "name") String name,
            @RequestParam(name = "description", required = false) String description,
            @RequestParam(name = "isPrivate", defaultValue = "false") boolean isPrivate,
            @AuthenticationPrincipal User currentUser) {
        
        log.info("Creating channel {} (private: {}) in workspace {}", name, isPrivate, workspaceId);
        ChannelResponse channel = channelService.createChannel(workspaceId, name, description, isPrivate, false, currentUser);
        return ResponseEntity.ok(ApiResponse.success(channel, "Channel created successfully"));
    }

    @GetMapping("/workspace/{workspaceId}")
    @Operation(summary = "Get workspace channels", description = "Retrieves all visible channels for a workspace.")
    public ResponseEntity<ApiResponse<List<ChannelResponse>>> getWorkspaceChannels(
            @PathVariable(name = "workspaceId") Long workspaceId,
            @AuthenticationPrincipal User currentUser) {
        List<ChannelResponse> channels = channelService.getWorkspaceChannels(workspaceId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(channels, "Channels fetched successfully"));
    }

    @GetMapping("/workspace/{workspaceId}/archived")
    @Operation(summary = "Get archived channels", description = "Fetches archived channels in a workspace.")
    public ResponseEntity<ApiResponse<List<ChannelResponse>>> getArchivedChannels(
            @PathVariable(name = "workspaceId") Long workspaceId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(channelService.getArchivedChannels(workspaceId, currentUser)));
    }

    @GetMapping("/workspace/{workspaceId}/deleted")
    @Operation(summary = "Get deleted channels (Trash)", description = "Fetches soft-deleted channels in a workspace.")
    public ResponseEntity<ApiResponse<List<ChannelResponse>>> getDeletedChannels(
            @PathVariable(name = "workspaceId") Long workspaceId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(channelService.getDeletedChannels(workspaceId, currentUser)));
    }

    @GetMapping("/{channelId}/members")
    @Operation(summary = "Get channel members", description = "Retrieves all users in a channel.")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getChannelMembers(
            @PathVariable(name = "channelId") Long channelId) {
        
        List<UserResponse> members = channelService.getChannelMembers(channelId);
        return ResponseEntity.ok(ApiResponse.success(members, "Members fetched successfully"));
    }

    @PostMapping("/{channelId}/invite")
    @Operation(summary = "Invite user to channel", description = "Sends an invitation to a user to join a channel.")
    public ResponseEntity<ApiResponse<Void>> inviteUser(
            @PathVariable(name = "channelId") Long channelId,
            @Valid @RequestBody InviteUserRequest request,
            @AuthenticationPrincipal User currentUser) {
        
        log.info("Inviting user {} to channel {}", request.getEmail(), channelId);
        channelService.inviteUser(channelId, request.getEmail(), currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Invitation sent"));
    }

    @PostMapping("/{channelId}/archive")
    @Operation(summary = "Archive channel", description = "Archives a channel, preventing further messages.")
    public ResponseEntity<ApiResponse<Void>> archiveChannel(
            @PathVariable(name = "channelId") Long channelId,
            @AuthenticationPrincipal User currentUser) {
        log.info("Archiving channel {}", channelId);
        channelService.archiveChannel(channelId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Channel archived"));
    }

    @PostMapping("/{channelId}/restore")
    @Operation(summary = "Restore channel", description = "Restores a channel from archive or trash.")
    public ResponseEntity<ApiResponse<Void>> restoreChannel(
            @PathVariable(name = "channelId") Long channelId,
            @AuthenticationPrincipal User currentUser) {
        log.info("Restoring channel {}", channelId);
        channelService.restoreChannel(channelId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Channel restored"));
    }

    @DeleteMapping("/{channelId}")
    @Operation(summary = "Soft delete channel", description = "Moves channel to trash.")
    public ResponseEntity<ApiResponse<Void>> deleteChannel(
            @PathVariable(name = "channelId") Long channelId,
            @AuthenticationPrincipal User currentUser) {
        log.info("Soft deleting channel {}", channelId);
        channelService.deleteChannel(channelId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Channel moved to trash"));
    }

    @DeleteMapping("/{channelId}/permanent")
    @Operation(summary = "Permanently delete channel", description = "Permanently deletes a channel from trash.")
    public ResponseEntity<ApiResponse<Void>> permanentlyDeleteChannel(
            @PathVariable(name = "channelId") Long channelId,
            @AuthenticationPrincipal User currentUser) {
        log.info("Permanently deleting channel {}", channelId);
        channelService.permanentlyDeleteChannel(channelId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Channel permanently deleted"));
    }

    @PostMapping("/{channelId}/leave")
    @Operation(summary = "Leave channel", description = "Current user leaves the channel.")
    public ResponseEntity<ApiResponse<Void>> leaveChannel(
            @PathVariable(name = "channelId") Long channelId,
            @AuthenticationPrincipal User currentUser) {
        log.info("Leaving channel {}", channelId);
        channelService.leaveChannel(channelId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Left channel"));
    }

    @DeleteMapping("/{channelId}/members/{userId}")
    @Operation(summary = "Remove member from channel", description = "Removes a user from the channel. If from default channel by owner, removes from workspace.")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable(name = "channelId") Long channelId,
            @PathVariable(name = "userId") Long userId,
            @AuthenticationPrincipal User currentUser) {
        log.info("Removing user {} from channel {}", userId, channelId);
        channelService.removeMember(channelId, userId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Member removed successfully"));
    }

    @PostMapping("/{channelId}/transfer-ownership")
    @Operation(summary = "Transfer channel ownership", description = "Transfers ownership to another member.")
    public ResponseEntity<ApiResponse<Void>> transferOwnership(
            @PathVariable(name = "channelId") Long channelId,
            @RequestParam(name = "newOwnerId") Long newOwnerId,
            @AuthenticationPrincipal User currentUser) {
        log.info("Transferring ownership of channel {} to {}", channelId, newOwnerId);
        channelService.transferOwnership(channelId, newOwnerId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Ownership transferred"));
    }
}
