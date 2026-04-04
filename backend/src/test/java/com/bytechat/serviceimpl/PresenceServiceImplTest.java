package com.bytechat.serviceimpl;

import com.bytechat.entity.User;
import com.bytechat.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PresenceServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PresenceServiceImpl presenceService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder().email("user@example.com").online(false).build();
    }

    @Test
    void handleUserConnect_Success() {
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        presenceService.handleUserConnect("user@example.com");

        assertTrue(user.isOnline());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void handleUserDisconnect_Success() {
        user.setOnline(true);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        presenceService.handleUserDisconnect("user@example.com");

        assertFalse(user.isOnline());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void handleUserConnect_UserNotFound_DoesNothing() {
        when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());

        presenceService.handleUserConnect("notfound@example.com");

        verify(userRepository, never()).save(any());
    }
}
