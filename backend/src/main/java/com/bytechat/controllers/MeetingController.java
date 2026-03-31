package com.bytechat.controllers;

import com.bytechat.dto.request.CreateMeetingRequest;
import com.bytechat.dto.request.JoinMeetingRequest;
import com.bytechat.dto.response.ApiResponse;
import com.bytechat.dto.response.MeetingResponse;
import com.bytechat.entity.User;
import com.bytechat.services.MeetingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meetings")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Meetings", description = "Endpoints for channel video meetings")
@SecurityRequirement(name = "Bearer Authentication")
public class MeetingController {

    private final MeetingService meetingService;

    @PostMapping("/channels/{channelId}")
    @Operation(summary = "Create a meeting in a channel")
    public ResponseEntity<ApiResponse<MeetingResponse>> createMeeting(
            @Parameter(description = "Channel ID") @PathVariable Long channelId,
            @Valid @RequestBody CreateMeetingRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(
                meetingService.createMeeting(channelId, request.getTitle(), request.getPassword(), currentUser),
                "Meeting created"
        ));
    }

    @GetMapping("/workspaces/{workspaceId}")
    @Operation(summary = "Get active meetings in a workspace")
    public ResponseEntity<ApiResponse<List<MeetingResponse>>> getActiveMeetings(
            @Parameter(description = "Workspace ID") @PathVariable Long workspaceId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(
                meetingService.getActiveWorkspaceMeetings(workspaceId, currentUser),
                "Meetings fetched"
        ));
    }

    @GetMapping("/{meetingId}")
    @Operation(summary = "Get an active meeting by ID")
    public ResponseEntity<ApiResponse<MeetingResponse>> getMeeting(
            @Parameter(description = "Meeting ID") @PathVariable Long meetingId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(
                meetingService.getMeeting(meetingId, currentUser),
                "Meeting fetched"
        ));
    }

    @PostMapping("/{meetingId}/join")
    @Operation(summary = "Join a meeting with password")
    public ResponseEntity<ApiResponse<MeetingResponse>> joinMeeting(
            @Parameter(description = "Meeting ID") @PathVariable Long meetingId,
            @Valid @RequestBody JoinMeetingRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(
                meetingService.joinMeeting(meetingId, request.getPassword(), currentUser),
                "Meeting joined"
        ));
    }

    @PostMapping("/{meetingId}/end")
    @Operation(summary = "End a meeting")
    public ResponseEntity<ApiResponse<Void>> endMeeting(
            @Parameter(description = "Meeting ID") @PathVariable Long meetingId,
            @AuthenticationPrincipal User currentUser) {
        meetingService.endMeeting(meetingId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Meeting ended"));
    }
}
