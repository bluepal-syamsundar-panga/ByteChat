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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> getUsers() {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers(), "Users fetched"));
    }

    @GetMapping("/online")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getOnlineUsers() {
        return ResponseEntity.ok(ApiResponse.success(userService.getOnlineUsers(), "Online users fetched"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity
                .ok(ApiResponse.success(userService.getUserProfile(currentUser.getId()), "Current user fetched"));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateCurrentUser(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity
                .ok(ApiResponse.success(userService.updateProfile(currentUser.getId(), request), "Profile updated"));
    }

    @PostMapping("/me/avatar")
    public ResponseEntity<ApiResponse<UserResponse>> updateAvatar(
            @AuthenticationPrincipal User currentUser,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity
                .ok(ApiResponse.success(userService.updateAvatar(currentUser.getId(), file), "Avatar updated"));
    }

    @GetMapping("/shared")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getSharedRoomUsers(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(userService.getSharedRoomUsers(currentUser.getId()), "Shared room users fetched"));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserProfile(@PathVariable(name = "userId") Long userId) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserProfile(userId), "User profile fetched"));
    }
}
