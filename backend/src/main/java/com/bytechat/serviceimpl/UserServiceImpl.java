package com.bytechat.serviceimpl;

import com.bytechat.dto.response.UserResponse;
import com.bytechat.entity.User;
import com.bytechat.repository.UserRepository;
import com.bytechat.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

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

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .lastSeen(user.getLastSeen())
                .online(user.isOnline())
                .role(user.getRole().name())
                .build();
    }
}
