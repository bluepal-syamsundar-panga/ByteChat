package com.bytechat.services;

import com.bytechat.dto.request.UpdateProfileRequest;
import com.bytechat.dto.response.UserResponse;

import java.util.List;

public interface UserService {
    List<UserResponse> getAllUsers();
    List<UserResponse> getOnlineUsers();
    UserResponse getUserProfile(Long userId);
    UserResponse updateProfile(Long userId, UpdateProfileRequest request);
}
