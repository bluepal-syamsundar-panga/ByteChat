package com.bytechat.controllers;

import com.bytechat.dto.request.CreateWorkspaceRequest;
import com.bytechat.dto.request.InviteUserRequest;
import com.bytechat.dto.response.ApiResponse;
import com.bytechat.dto.response.WorkspaceResponse;
import com.bytechat.dto.response.UserResponse;
import com.bytechat.dto.response.WorkspaceCreationResponse;
import com.bytechat.entity.User;
import com.bytechat.services.OtpService;
import com.bytechat.services.WorkspaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Workspaces", description = "Endpoints for workspace management")
@io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "Bearer Authentication")
public class WorkspaceController {

    private static final String USER_NOT_AUTHENTICATED = "User not authenticated";

    private final WorkspaceService workspaceService;
    private final OtpService otpService;

    @Operation(summary = "Send OTP for workspace creation", description = "Generates and sends an OTP to the provided email for workspace registration.")
    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<Void>> sendOtp(
            @Parameter(description = "Email address for verification") @RequestParam(name = "email") String email) {
        log.info("Requesting workspace creation OTP for email: {}", email);
        otpService.generateAndSendOtp(email, com.bytechat.entity.OtpType.WORKSPACE_CREATION);
        return ResponseEntity.ok(ApiResponse.success(null, "OTP sent to " + email));
    }

    @Operation(summary = "Verify OTP", description = "Verifies the OTP sent to the user's email.")
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Boolean>> verifyOtp(
            @Parameter(description = "Email address") @RequestParam(name = "email") String email, 
            @Parameter(description = "6-digit OTP code") @RequestParam(name = "code") String code) {
        log.info("Verifying workspace creation OTP for email: {}", email);
        boolean verified = otpService.verifyOtp(email, code);
        if (verified) {
            return ResponseEntity.ok(ApiResponse.success(true, "OTP verified successfully"));
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid or expired OTP"));
        }
    }

    @Operation(summary = "Create workspace with details", description = "Creates a new workspace and sets up the owner. Requires email verification.")
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<WorkspaceCreationResponse>> createWorkspace(
            @Valid @RequestBody CreateWorkspaceRequest request,
            @Parameter(description = "Verified email address") @RequestParam(name = "email") String email,
            @AuthenticationPrincipal User currentUser) {
        
        log.info("Creating workspace: {} for email: {}", request.getName(), email);
        if (!otpService.isEmailVerified(email)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email not verified"));
        }

        WorkspaceCreationResponse result = workspaceService.createWorkspaceWithDetails(request, email, currentUser);
        return ResponseEntity.ok(ApiResponse.success(result, "Workspace created successfully"));
    }

    @GetMapping
    @Operation(summary = "Get user workspaces", description = "Retrieves a paginated list of workspaces the current user is a member of.")
    public ResponseEntity<ApiResponse<Page<WorkspaceResponse>>> getUserWorkspaces(
            @Parameter(description = "Page number (0-indexed)") @RequestParam(name = "page", defaultValue = "0") int page,
            @Parameter(description = "Number of items per page") @RequestParam(name = "size", defaultValue = "50") int size,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error(USER_NOT_AUTHENTICATED));
        }
        Page<WorkspaceResponse> workspaces = workspaceService.getUserWorkspaces(currentUser, page, size);
        return ResponseEntity.ok(ApiResponse.success(workspaces, "Workspaces fetched successfully"));
    }

    @Operation(summary = "Join workspace", description = "Allows the current user to join a workspace.")
    @PostMapping("/{workspaceId}/join")
    public ResponseEntity<ApiResponse<Void>> joinWorkspace(
            @Parameter(description = "ID of the workspace to join") @PathVariable(name = "workspaceId") Long workspaceId,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error(USER_NOT_AUTHENTICATED));
        }
        workspaceService.joinWorkspace(workspaceId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Joined workspace successfully"));
    }

    @Operation(summary = "Invite user to workspace", description = "Sends a workspace invitation to a user by email.")
    @PostMapping("/{workspaceId}/invite")
    public ResponseEntity<ApiResponse<Void>> inviteUser(
            @Parameter(description = "ID of the workspace") @PathVariable(name = "workspaceId") Long workspaceId,
            @Valid @RequestBody InviteUserRequest request,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error(USER_NOT_AUTHENTICATED));
        }
        workspaceService.inviteUser(workspaceId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Invitation sent"));
    }

    @Operation(summary = "Leave workspace", description = "Allows a non-owner member to leave the workspace and lose access.")
    @PostMapping("/{workspaceId}/leave")
    public ResponseEntity<ApiResponse<Void>> leaveWorkspace(
            @Parameter(description = "ID of the workspace") @PathVariable(name = "workspaceId") Long workspaceId,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error(USER_NOT_AUTHENTICATED));
        }
        workspaceService.leaveWorkspace(workspaceId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Left workspace successfully"));
    }

    @Operation(summary = "Get workspace members", description = "Retrieves a list of all members in a specific workspace.")
    @GetMapping("/{workspaceId}/members")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getWorkspaceMembers(
            @Parameter(description = "ID of the workspace") @PathVariable(name = "workspaceId") Long workspaceId,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error(USER_NOT_AUTHENTICATED));
        }
        return ResponseEntity.ok(ApiResponse.success(workspaceService.getWorkspaceMembers(workspaceId, currentUser), "Workspace members fetched"));
    }

    @Operation(summary = "Remove member from workspace", description = "Allows the workspace owner to remove a member.")
    @DeleteMapping("/{workspaceId}/members/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @Parameter(description = "ID of the workspace") @PathVariable(name = "workspaceId") Long workspaceId,
            @Parameter(description = "ID of the user to remove") @PathVariable(name = "userId") Long userId,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error(USER_NOT_AUTHENTICATED));
        }
        workspaceService.removeMember(workspaceId, userId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Member removed from workspace"));
    }

    @Operation(summary = "Delete workspace", description = "Allows the workspace owner to delete the workspace and all of its channels for every member.")
    @DeleteMapping("/{workspaceId}")
    public ResponseEntity<ApiResponse<Void>> deleteWorkspace(
            @Parameter(description = "ID of the workspace") @PathVariable(name = "workspaceId") Long workspaceId,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error(USER_NOT_AUTHENTICATED));
        }
        workspaceService.deleteWorkspace(workspaceId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Workspace deleted successfully"));
    }
}
