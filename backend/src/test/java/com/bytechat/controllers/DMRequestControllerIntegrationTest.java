package com.bytechat.controllers;

import com.bytechat.AbstractIntegrationTest;
import com.bytechat.config.TestWebSocketConfig;
import com.bytechat.entity.DMRequest;
import com.bytechat.entity.User;
import com.bytechat.services.DMRequestService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestWebSocketConfig.class)
class DMRequestControllerIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DMRequestService dmRequestService;

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
    void sendRequest_Success() throws Exception {
        User receiver = User.builder().id(2L).build();
        DMRequest dmRequest = DMRequest.builder().id(100L).sender(testUser).receiver(receiver).build();
        when(dmRequestService.sendRequest(anyLong(), any(com.bytechat.entity.User.class), anyLong())).thenReturn(dmRequest);

        mockMvc.perform(post("/api/dm/requests/send/1/2").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void acceptRequest_Success() throws Exception {
        DMRequest dmRequest = DMRequest.builder().id(100L).sender(testUser).receiver(testUser).build();
        when(dmRequestService.acceptRequest(any(com.bytechat.entity.User.class), anyLong())).thenReturn(dmRequest);

        mockMvc.perform(post("/api/dm/requests/accept/100").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void rejectRequest_Success() throws Exception {
        doNothing().when(dmRequestService).rejectRequest(any(com.bytechat.entity.User.class), anyLong());

        mockMvc.perform(post("/api/dm/requests/reject/100").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void getPendingRequests_Success() throws Exception {
        when(dmRequestService.getPendingRequests(any(com.bytechat.entity.User.class))).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/dm/requests/pending").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
