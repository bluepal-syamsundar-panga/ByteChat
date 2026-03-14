package com.bytechat.services;

import com.bytechat.dto.response.UserResponse;

import java.util.List;

public interface UserService {
    List<UserResponse> getOnlineUsers();
    UserResponse getUserProfile(Long userId);
}
