package com.bytechat.controllers;

import com.bytechat.dto.request.InviteUserRequest;
import com.bytechat.dto.response.ApiResponse;
import com.bytechat.dto.response.ChannelResponse;
import com.bytechat.dto.response.UserResponse;
import com.bytechat.entity.User;
import com.bytechat.services.ChannelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
@io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "Bearer Authentication")
public class ChannelController {

    private final ChannelService channelService;

    @PostMapping("/workspace/{workspaceId}")
    @Operation(summary = "Create channel", description = "Creates a new channel in a workspace.")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Channel created successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid channel data")
    })
    public ResponseEntity<ApiResponse<ChannelResponse>> createChannel(
            @Parameter(description = "ID of the workspace") @PathVariable(name = "workspaceId") Long workspaceId,
            @Parameter(description = "Name of the channel") @RequestParam(name = "name") String name,
            @Parameter(description = "Optional description") @RequestParam(name = "description", required = false) String description,
            @Parameter(description = "Whether the channel is private") @RequestParam(name = "isPrivate", defaultValue = "false") boolean isPrivate,
            @AuthenticationPrincipal User currentUser) {
        
        log.info("Creating channel {} (private: {}) in workspace {}", name, isPrivate, workspaceId);
        ChannelResponse channel = channelService.createChannel(workspaceId, name, description, isPrivate, false, currentUser);
        return ResponseEntity.ok(ApiResponse.success(channel, "Channel created successfully"));
    }

    @GetMapping("/workspace/{workspaceId}")
    @Operation(summary = "Get workspace channels", description = "Retrieves all visible channels for a workspace.")
    public ResponseEntity<ApiResponse<List<ChannelResponse>>> getWorkspaceChannels(
            @Parameter(description = "ID of the workspace") @PathVariable(name = "workspaceId") Long workspaceId,
            @AuthenticationPrincipal User currentUser) {
        List<ChannelResponse> channels = channelService.getWorkspaceChannels(workspaceId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(channels, "Channels fetched successfully"));
    }

    @GetMapping("/workspace/{workspaceId}/archived")
    @Operation(summary = "Get archived channels", description = "Fetches archived channels in a workspace.")
    public ResponseEntity<ApiResponse<List<ChannelResponse>>> getArchivedChannels(
            @Parameter(description = "ID of the workspace") @PathVariable(name = "workspaceId") Long workspaceId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(channelService.getArchivedChannels(workspaceId, currentUser)));
    }

    @GetMapping("/workspace/{workspaceId}/deleted")
    @Operation(summary = "Get deleted channels (Trash)", description = "Fetches soft-deleted channels in a workspace.")
    public ResponseEntity<ApiResponse<List<ChannelResponse>>> getDeletedChannels(
            @Parameter(description = "ID of the workspace") @PathVariable(name = "workspaceId") Long workspaceId,
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
            @Parameter(description = "ID of the channel") @PathVariable(name = "channelId") Long channelId,
            @Valid @RequestBody InviteUserRequest request,
            @AuthenticationPrincipal User currentUser) {
        
        log.info("Inviting user {} to channel {}", request.getEmail(), channelId);
        channelService.inviteUser(channelId, request.getEmail(), currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Invitation sent"));
    }

    @PostMapping("/{channelId}/archive")
    @Operation(summary = "Archive channel", description = "Archives a channel, preventing further messages.")
    public ResponseEntity<ApiResponse<Void>> archiveChannel(
            @Parameter(description = "ID of the channel") @PathVariable(name = "channelId") Long channelId,
            @AuthenticationPrincipal User currentUser) {
        log.info("Archiving channel {}", channelId);
        channelService.archiveChannel(channelId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Channel archived"));
    }

    @PostMapping("/{channelId}/restore")
    @Operation(summary = "Restore channel", description = "Restores a channel from archive or trash.")
    public ResponseEntity<ApiResponse<Void>> restoreChannel(
            @Parameter(description = "ID of the channel to restore") @PathVariable(name = "channelId") Long channelId,
            @AuthenticationPrincipal User currentUser) {
        log.info("Restoring channel {}", channelId);
        channelService.restoreChannel(channelId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Channel restored"));
    }

    @DeleteMapping("/{channelId}")
    @Operation(summary = "Soft delete channel", description = "Moves channel to trash.")
    public ResponseEntity<ApiResponse<Void>> deleteChannel(
            @Parameter(description = "ID of the channel to move to trash") @PathVariable(name = "channelId") Long channelId,
            @AuthenticationPrincipal User currentUser) {
        log.info("Soft deleting channel {}", channelId);
        channelService.deleteChannel(channelId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Channel moved to trash"));
    }

    @DeleteMapping("/{channelId}/permanent")
    @Operation(summary = "Permanently delete channel", description = "Permanently deletes a channel from trash.")
    public ResponseEntity<ApiResponse<Void>> permanentlyDeleteChannel(
            @Parameter(description = "ID of the channel to delete permanently") @PathVariable(name = "channelId") Long channelId,
            @AuthenticationPrincipal User currentUser) {
        log.info("Permanently deleting channel {}", channelId);
        channelService.permanentlyDeleteChannel(channelId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Channel permanently deleted"));
    }

    @PostMapping("/{channelId}/leave")
    @Operation(summary = "Leave channel", description = "Current user leaves the channel.")
    public ResponseEntity<ApiResponse<Void>> leaveChannel(
            @Parameter(description = "ID of the channel to leave") @PathVariable(name = "channelId") Long channelId,
            @AuthenticationPrincipal User currentUser) {
        log.info("Leaving channel {}", channelId);
        channelService.leaveChannel(channelId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Left channel"));
    }

    @DeleteMapping("/{channelId}/members/{userId}")
    @Operation(summary = "Remove member from channel", description = "Removes a user from the channel. If from default channel by owner, removes from workspace.")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @Parameter(description = "ID of the channel") @PathVariable(name = "channelId") Long channelId,
            @Parameter(description = "ID of the user to remove") @PathVariable(name = "userId") Long userId,
            @AuthenticationPrincipal User currentUser) {
        log.info("Removing user {} from channel {}", userId, channelId);
        channelService.removeMember(channelId, userId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Member removed successfully"));
    }

    @PostMapping("/{channelId}/transfer-ownership")
    @Operation(summary = "Transfer channel ownership", description = "Transfers ownership to another member.")
    public ResponseEntity<ApiResponse<Void>> transferOwnership(
            @Parameter(description = "ID of the channel") @PathVariable(name = "channelId") Long channelId,
            @Parameter(description = "ID of the new owner") @RequestParam(name = "newOwnerId") Long newOwnerId,
            @AuthenticationPrincipal User currentUser) {
        log.info("Transferring ownership of channel {} to {}", channelId, newOwnerId);
        channelService.transferOwnership(channelId, newOwnerId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Ownership transferred"));
    }

    @PostMapping("/{channelId}/members/{userId}/make-admin")
    @Operation(summary = "Make channel admin", description = "Promotes a channel member to admin without removing existing admins.")
    public ResponseEntity<ApiResponse<Void>> makeAdmin(
            @Parameter(description = "ID of the channel") @PathVariable(name = "channelId") Long channelId,
            @Parameter(description = "ID of the user to promote") @PathVariable(name = "userId") Long userId,
            @AuthenticationPrincipal User currentUser) {
        log.info("Promoting user {} to admin in channel {}", userId, channelId);
        channelService.makeAdmin(channelId, userId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Member promoted to admin"));
    }

    @PostMapping("/{channelId}/members/{userId}/remove-admin")
    @Operation(summary = "Remove channel admin", description = "Demotes a channel admin to a normal member.")
    public ResponseEntity<ApiResponse<Void>> removeAdmin(
            @Parameter(description = "ID of the channel") @PathVariable(name = "channelId") Long channelId,
            @Parameter(description = "ID of the user to demote") @PathVariable(name = "userId") Long userId,
            @AuthenticationPrincipal User currentUser) {
        log.info("Demoting user {} from admin in channel {}", userId, channelId);
        channelService.removeAdmin(channelId, userId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Admin removed successfully"));
    }
}
