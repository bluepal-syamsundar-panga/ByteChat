package com.bytechat.controllers;

import com.bytechat.dto.response.ApiResponse;
import com.bytechat.dto.response.DMRequestResponse;
import com.bytechat.entity.DMRequest;
import com.bytechat.entity.User;
import com.bytechat.services.DMRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import java.util.List;

@RestController
@RequestMapping("/api/dm/requests")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "DM Requests", description = "Endpoints for sending and managing direct message requests")
@SecurityRequirement(name = "Bearer Authentication")
public class DMRequestController {

    private final DMRequestService dmRequestService;

    @Operation(summary = "Send DM request", description = "Sends a new direct message request to another user in a workspace.")
    @PostMapping("/send/{workspaceId}/{receiverId}")
    public ResponseEntity<ApiResponse<DMRequestResponse>> sendRequest(
            @Parameter(description = "ID of the workspace") @PathVariable(name = "workspaceId") Long workspaceId,
            @Parameter(description = "ID of the recipient user") @PathVariable(name = "receiverId") Long receiverId,
            @AuthenticationPrincipal User sender) {
        DMRequest request = dmRequestService.sendRequest(workspaceId, sender, receiverId);
        return ResponseEntity.ok(ApiResponse.success(DMRequestResponse.fromEntity(request), "DM request sent successfully"));
    }

    @Operation(summary = "Accept DM request", description = "Accepts a pending direct message request.")
    @PostMapping("/accept/{requestId}")
    public ResponseEntity<ApiResponse<DMRequestResponse>> acceptRequest(
            @Parameter(description = "ID of the direct message request") @PathVariable(name = "requestId") Long requestId,
            @AuthenticationPrincipal User receiver) {
        DMRequest request = dmRequestService.acceptRequest(receiver, requestId);
        return ResponseEntity.ok(ApiResponse.success(DMRequestResponse.fromEntity(request), "DM request accepted"));
    }

    @Operation(summary = "Reject DM request", description = "Rejects a pending direct message request.")
    @PostMapping("/reject/{requestId}")
    public ResponseEntity<ApiResponse<Void>> rejectRequest(
            @Parameter(description = "ID of the direct message request") @PathVariable(name = "requestId") Long requestId,
            @AuthenticationPrincipal User receiver) {
        dmRequestService.rejectRequest(receiver, requestId);
        return ResponseEntity.ok(ApiResponse.success(null, "DM request rejected"));
    }

    @Operation(summary = "Get pending DM requests", description = "Retrieves a list of pending direct message requests for the current user.")
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<DMRequestResponse>>> getPendingRequests(
            @AuthenticationPrincipal User user) {
        List<DMRequest> requests = dmRequestService.getPendingRequests(user);
        List<DMRequestResponse> responses = requests.stream()
                .map(DMRequestResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(responses, "Pending requests fetched"));
    }
}
