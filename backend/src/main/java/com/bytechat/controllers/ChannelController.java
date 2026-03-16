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
            @AuthenticationPrincipal User currentUser) {
        
        log.info("Creating channel {} in workspace {}", name, workspaceId);
        ChannelResponse channel = channelService.createChannel(workspaceId, name, description, false, currentUser);
        return ResponseEntity.ok(ApiResponse.success(channel, "Channel created successfully"));
    }

    @GetMapping("/workspace/{workspaceId}")
    @Operation(summary = "Get workspace channels", description = "Retrieves all channels for a workspace.")
    public ResponseEntity<ApiResponse<List<ChannelResponse>>> getWorkspaceChannels(
            @PathVariable(name = "workspaceId") Long workspaceId) {
        
        List<ChannelResponse> channels = channelService.getWorkspaceChannels(workspaceId);
        return ResponseEntity.ok(ApiResponse.success(channels, "Channels fetched successfully"));
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
}
