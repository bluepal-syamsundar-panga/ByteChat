package com.bytechat.controllers;

import com.bytechat.dto.request.CreateWorkspaceRequest;
import com.bytechat.entity.User;
import com.bytechat.services.OtpService;
import com.bytechat.services.WorkspaceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import com.bytechat.config.TestWebSocketConfig;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Import;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestWebSocketConfig.class)
class WorkspaceControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private WorkspaceService workspaceService;

    @MockBean
    private OtpService otpService;

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
    void sendOtp_Success() throws Exception {
        mockMvc.perform(post("/api/workspaces/send-otp")
                .param("email", "test@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void verifyOtp_Success() throws Exception {
        when(otpService.verifyOtp(anyString(), anyString())).thenReturn(true);

        mockMvc.perform(post("/api/workspaces/verify-otp")
                .param("email", "test@example.com")
                .param("code", "123456"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value(true));
    }

    @Test
    void createWorkspace_Failure_NotVerified() throws Exception {
        CreateWorkspaceRequest request = new CreateWorkspaceRequest();
        request.setName("New Workspace");

        when(otpService.isEmailVerified(anyString())).thenReturn(false);

        mockMvc.perform(post("/api/workspaces/create")
                .param("email", "test@example.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Email not verified"));
    }

    @Test
    void getWorkspaceMembers_Success() throws Exception {
        when(workspaceService.getWorkspaceMembers(anyLong(), any())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/workspaces/1/members").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
