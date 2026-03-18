package com.bytechat.controllers;

import com.bytechat.entity.DMRequest;
import com.bytechat.entity.DMRequestStatus;
import com.bytechat.entity.User;
import com.bytechat.entity.Workspace;
import com.bytechat.services.DMRequestService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DMRequestControllerIntegrationTest {

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
        User sender = User.builder().id(1L).displayName("Sender").build();
        User receiver = User.builder().id(2L).displayName("Receiver").build();
        Workspace workspace = Workspace.builder().id(1L).build();
        DMRequest request = DMRequest.builder().id(1L).sender(sender).receiver(receiver).workspace(workspace).status(DMRequestStatus.PENDING).build();
        
        when(dmRequestService.sendRequest(anyLong(), any(), anyLong())).thenReturn(request);

        mockMvc.perform(post("/api/dm/requests/send/1/2").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    void getPendingRequests_Success() throws Exception {
        when(dmRequestService.getPendingRequests(any())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/dm/requests/pending").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
