package com.bytechat.controllers;

import com.bytechat.dto.request.UpdateProfileRequest;
import com.bytechat.dto.response.UserResponse;
import com.bytechat.entity.User;
import com.bytechat.services.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserControllerIntegrationTest {

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
    void getCurrentUser_Success() throws Exception {
        UserResponse response = UserResponse.builder().id(1L).email("test@example.com").build();
        when(userService.getUserProfile(anyLong())).thenReturn(response);

        mockMvc.perform(get("/api/users/me").with(user(testUser)))
                .andExpect(status().isOk());
    }

    @Test
    void updateProfile_Success() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setDisplayName("Updated Name");

        UserResponse response = UserResponse.builder().id(1L).displayName("Updated Name").build();
        when(userService.updateProfile(anyLong(), any())).thenReturn(response);

        mockMvc.perform(put("/api/users/me")
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.displayName").value("Updated Name"));
    }
}
