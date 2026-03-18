package com.bytechat.serviceimpl;

import com.bytechat.dto.request.UpdateProfileRequest;
import com.bytechat.dto.response.UserResponse;
import com.bytechat.entity.DMRequestStatus;
import com.bytechat.entity.User;
import com.bytechat.repository.DirectMessageRepository;
import com.bytechat.repository.UserRepository;
import com.bytechat.services.CloudinaryService;
import com.bytechat.services.UserService;
import com.bytechat.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;
    private final DirectMessageRepository directMessageRepository;

    @Override
    public List<UserResponse> getAllUsers() {
        log.info("Fetching all users");
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<UserResponse> getOnlineUsers() {
        log.info("Fetching all online users");
        return userRepository.findAll().stream()
                .filter(User::isOnline)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public UserResponse getUserProfile(Long userId) {
        log.info("Fetching profile for user ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        return mapToResponse(user);
    }

    @Override
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        log.info("Updating profile for user ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        user.setDisplayName(request.getDisplayName());
        user.setAvatarUrl(request.getAvatarUrl());
        return mapToResponse(userRepository.save(user));
    }

    @Override
    public UserResponse updateAvatar(Long userId, MultipartFile file) {
        log.info("Updating avatar for user ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        try {
            String avatarUrl = cloudinaryService.uploadFile(file);
            user.setAvatarUrl(avatarUrl);
            log.info("Avatar updated successfully for user ID: {}", userId);
            return mapToResponse(userRepository.save(user));
        } catch (IOException e) {
            log.error("Failed to upload avatar for user ID: {}. Error: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to upload avatar", e);
        }
    }

    @Override
    public List<UserResponse> getSharedRoomUsers(Long userId) {
        log.info("Fetching shared room users for user ID: {}", userId);
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
