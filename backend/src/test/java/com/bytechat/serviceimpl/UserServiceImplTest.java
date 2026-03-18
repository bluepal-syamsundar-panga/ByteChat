package com.bytechat.serviceimpl;

import com.bytechat.dto.request.UpdateProfileRequest;
import com.bytechat.dto.response.UserResponse;
import com.bytechat.entity.Role;
import com.bytechat.entity.User;
import com.bytechat.exception.ResourceNotFoundException;
import com.bytechat.repository.DirectMessageRepository;
import com.bytechat.repository.UserRepository;
import com.bytechat.services.CloudinaryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private CloudinaryService cloudinaryService;
    @Mock
    private DirectMessageRepository directMessageRepository;

    @InjectMocks
    private UserServiceImpl userService;

    private User user;
    private User onlineUser;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .email("test@example.com")
                .displayName("Test User")
                .role(Role.MEMBER)
                .online(false)
                .build();

        onlineUser = User.builder()
                .id(2L)
                .email("online@example.com")
                .displayName("Online User")
                .role(Role.MEMBER)
                .online(true)
                .build();
    }

    @Test
    void getAllUsers_ReturnsList() {
        when(userRepository.findAll()).thenReturn(Arrays.asList(user, onlineUser));

        List<UserResponse> responses = userService.getAllUsers();

        assertEquals(2, responses.size());
        verify(userRepository, times(1)).findAll();
    }

    @Test
    void getOnlineUsers_ReturnsFilteredList() {
        when(userRepository.findAll()).thenReturn(Arrays.asList(user, onlineUser));

        List<UserResponse> responses = userService.getOnlineUsers();

        assertEquals(1, responses.size());
        assertEquals("Online User", responses.get(0).getDisplayName());
    }

    @Test
    void getUserProfile_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UserResponse response = userService.getUserProfile(1L);

        assertNotNull(response);
        assertEquals("test@example.com", response.getEmail());
    }

    @Test
    void getUserProfile_NotFound_ThrowsException() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.getUserProfile(99L));
    }

    @Test
    void updateProfile_Success() {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setDisplayName("Updated Name");
        request.setAvatarUrl("http://new-avatar.com");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserResponse response = userService.updateProfile(1L, request);

        assertNotNull(response);
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void updateAvatar_Success() throws IOException {
        MultipartFile file = mock(MultipartFile.class);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cloudinaryService.uploadFile(file)).thenReturn("http://cloudinary.com/avatar.png");
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserResponse response = userService.updateAvatar(1L, file);

        assertNotNull(response);
        assertEquals("http://cloudinary.com/avatar.png", user.getAvatarUrl());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void updateAvatar_IOException_ThrowsException() throws IOException {
        MultipartFile file = mock(MultipartFile.class);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cloudinaryService.uploadFile(file)).thenThrow(new IOException("Upload failed"));

        assertThrows(RuntimeException.class, () -> userService.updateAvatar(1L, file));
    }
}
