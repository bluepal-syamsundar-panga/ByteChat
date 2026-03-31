package com.bytechat.controllers;

import com.bytechat.dto.request.UpdateProfileRequest;
import com.bytechat.dto.response.ApiResponse;
import com.bytechat.dto.response.UserResponse;
import com.bytechat.entity.User;
import com.bytechat.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "User Management", description = "Endpoints for managing user profiles and retrieving user information")
@SecurityRequirement(name = "Bearer Authentication")
public class UserController {

    private final UserService userService;

    @Operation(summary = "Get all users", description = "Retrieves a list of all registered users")
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> getUsers() {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers(), "Users fetched"));
    }

    @Operation(summary = "Get online users", description = "Retrieves a list of users who are currently online")
    @GetMapping("/online")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getOnlineUsers() {
        return ResponseEntity.ok(ApiResponse.success(userService.getOnlineUsers(), "Online users fetched"));
    }

    @Operation(summary = "Get current user profile", description = "Retrieves the profile information of the currently authenticated user")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity
                .ok(ApiResponse.success(userService.getUserProfile(currentUser.getId()), "Current user fetched"));
    }

    @Operation(summary = "Update current user profile", description = "Updates the profile information (display name, avatar URL) of the currently authenticated user")
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateCurrentUser(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity
                .ok(ApiResponse.success(userService.updateProfile(currentUser.getId(), request), "Profile updated"));
    }

    @Operation(summary = "Update user avatar", description = "Uploads and updates the avatar image for the currently authenticated user")
    @PostMapping("/me/avatar")
    public ResponseEntity<ApiResponse<UserResponse>> updateAvatar(
            @AuthenticationPrincipal User currentUser,
            @Parameter(description = "Avatar Image File") @RequestParam("file") MultipartFile file) {
        return ResponseEntity
                .ok(ApiResponse.success(userService.updateAvatar(currentUser.getId(), file), "Avatar updated"));
    }

    @Operation(summary = "Get shared room users", description = "Retrieves a list of users that the current user shares a room with")
    @GetMapping("/shared")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getSharedRoomUsers(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(userService.getSharedRoomUsers(currentUser.getId()), "Shared room users fetched"));
    }

    @Operation(summary = "Get user profile by ID", description = "Retrieves the profile information of a specific user by their ID")
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserProfile(
            @Parameter(description = "ID of the user to fetch") @PathVariable(name = "userId") Long userId) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserProfile(userId), "User profile fetched"));
    }
}
