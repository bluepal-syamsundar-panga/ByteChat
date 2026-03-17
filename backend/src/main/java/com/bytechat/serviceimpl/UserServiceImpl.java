package com.bytechat.serviceimpl;

import com.bytechat.dto.request.UpdateProfileRequest;
import com.bytechat.dto.response.UserResponse;
import com.bytechat.entity.DMRequestStatus;
import com.bytechat.entity.User;
import com.bytechat.repository.DirectMessageRepository;
import com.bytechat.repository.UserRepository;
import com.bytechat.services.CloudinaryService;
import com.bytechat.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;
    private final DirectMessageRepository directMessageRepository;

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<UserResponse> getOnlineUsers() {
        return userRepository.findAll().stream()
                .filter(User::isOnline)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public UserResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToResponse(user);
    }

    @Override
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setDisplayName(request.getDisplayName());
        user.setAvatarUrl(request.getAvatarUrl());
        return mapToResponse(userRepository.save(user));
    }

    @Override
    public UserResponse updateAvatar(Long userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        try {
            String avatarUrl = cloudinaryService.uploadFile(file);
            user.setAvatarUrl(avatarUrl);
            return mapToResponse(userRepository.save(user));
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload avatar", e);
        }
    }

    @Override
    public List<UserResponse> getSharedRoomUsers(Long userId) {
        return userRepository.findUsersSharingRoomWith(userId, DMRequestStatus.ACCEPTED).stream()
                .map(user -> mapToResponse(user, userId))
                .collect(Collectors.toList());
    }

    private UserResponse mapToResponse(User user) {
        return mapToResponse(user, null);
    }

    private UserResponse mapToResponse(User user, Long currentUserId) {
        UserResponse response = UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .lastSeen(user.getLastSeen())
                .online(user.isOnline())
                .role(user.getRole() != null ? user.getRole().name() : "MEMBER")
                .build();
        
        if (currentUserId != null) {
            response.setUnreadCount(directMessageRepository.countUnreadBySender(currentUserId, user.getId()));
        }
        
        return response;
    }
}
