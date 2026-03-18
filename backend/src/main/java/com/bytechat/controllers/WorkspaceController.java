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
public class WorkspaceController {

    private final WorkspaceService workspaceService;
    private final OtpService otpService;

    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<Void>> sendOtp(@RequestParam(name = "email") String email) {
        log.info("Requesting workspace creation OTP for email: {}", email);
        otpService.generateAndSendOtp(email, com.bytechat.entity.OtpType.WORKSPACE_CREATION);
        return ResponseEntity.ok(ApiResponse.success(null, "OTP sent to " + email));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Boolean>> verifyOtp(@RequestParam(name = "email") String email, @RequestParam(name = "code") String code) {
        log.info("Verifying workspace creation OTP for email: {}", email);
        boolean verified = otpService.verifyOtp(email, code);
        if (verified) {
            return ResponseEntity.ok(ApiResponse.success(true, "OTP verified successfully"));
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid or expired OTP"));
        }
    }

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<WorkspaceCreationResponse>> createWorkspace(
            @Valid @RequestBody CreateWorkspaceRequest request,
            @RequestParam(name = "email") String email,
            @AuthenticationPrincipal User currentUser) {
        
        log.info("Creating workspace: {} for email: {}", request.getName(), email);
        if (!otpService.isEmailVerified(email)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email not verified"));
        }

        WorkspaceCreationResponse result = workspaceService.createWorkspaceWithDetails(request, email, currentUser);
        return ResponseEntity.ok(ApiResponse.success(result, "Workspace created successfully"));
    }

    @GetMapping
    @Operation(summary = "Get user workspaces")
    public ResponseEntity<ApiResponse<Page<WorkspaceResponse>>> getUserWorkspaces(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("User not authenticated"));
        }
        Page<WorkspaceResponse> workspaces = workspaceService.getUserWorkspaces(currentUser, page, size);
        return ResponseEntity.ok(ApiResponse.success(workspaces, "Workspaces fetched successfully"));
    }

    @PostMapping("/{workspaceId}/join")
    public ResponseEntity<ApiResponse<Void>> joinWorkspace(
            @PathVariable(name = "workspaceId") Long workspaceId,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("User not authenticated"));
        }
        workspaceService.joinWorkspace(workspaceId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Joined workspace successfully"));
    }

    @PostMapping("/{workspaceId}/invite")
    public ResponseEntity<ApiResponse<Void>> inviteUser(
            @PathVariable(name = "workspaceId") Long workspaceId,
            @Valid @RequestBody InviteUserRequest request,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("User not authenticated"));
        }
        workspaceService.inviteUser(workspaceId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Invitation sent"));
    }

    @GetMapping("/{workspaceId}/members")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getWorkspaceMembers(
            @PathVariable(name = "workspaceId") Long workspaceId,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("User not authenticated"));
        }
        return ResponseEntity.ok(ApiResponse.success(workspaceService.getWorkspaceMembers(workspaceId, currentUser), "Workspace members fetched"));
    }

    @DeleteMapping("/{workspaceId}/members/{userId}")
    @Operation(summary = "Remove member from workspace", description = "Only owner can remove members.")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable(name = "workspaceId") Long workspaceId,
            @PathVariable(name = "userId") Long userId,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("User not authenticated"));
        }
        workspaceService.removeMember(workspaceId, userId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Member removed from workspace"));
    }
}
