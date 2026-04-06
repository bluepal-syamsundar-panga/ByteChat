package com.bytechat.controllers;

import com.bytechat.AbstractIntegrationTest;
import com.bytechat.config.TestWebSocketConfig;
import com.bytechat.dto.request.UpdateProfileRequest;
import com.bytechat.dto.response.UserResponse;
import com.bytechat.entity.User;
import com.bytechat.services.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestWebSocketConfig.class)
class UserControllerIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .displayName("Test User")
                .role(com.bytechat.entity.Role.MEMBER)
                .build();
    }

    @Test
    void getUsers_Success() throws Exception {
        when(userService.getAllUsers()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/users").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void getOnlineUsers_Success() throws Exception {
        when(userService.getOnlineUsers()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/users/online").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void getMe_Success() throws Exception {
        UserResponse response = UserResponse.builder().id(1L).email("test@example.com").build();
        when(userService.getUserProfile(anyLong())).thenReturn(response);

        mockMvc.perform(get("/api/users/me").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("test@example.com"));
    }

    @Test
    void updateCurrentUser_Success() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setDisplayName("New Name");
        UserResponse response = UserResponse.builder().id(1L).displayName("New Name").build();
        
        when(userService.updateProfile(anyLong(), any(UpdateProfileRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/users/me")
                        .with(user(testUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.displayName").value("New Name"));
    }

    @Test
    void getSharedRoomUsers_Success() throws Exception {
        when(userService.getSharedRoomUsers(anyLong())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/users/shared").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void getUserProfile_Success() throws Exception {
        UserResponse response = UserResponse.builder().id(1L).email("test@example.com").build();
        when(userService.getUserProfile(anyLong())).thenReturn(response);

        mockMvc.perform(get("/api/users/1").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
