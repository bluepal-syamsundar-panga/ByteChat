package com.bytechat.controllers;

import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.entity.Role;
import com.bytechat.entity.User;
import com.bytechat.services.DirectMessageService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class DirectMessageControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DirectMessageService directMessageService;

    // ✅ FIX: mock this to avoid bean conflict
    @MockBean
    private SimpMessagingTemplate messagingTemplate;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .displayName("Test User")
                .role(Role.MEMBER)
                .build();
    }

    @Test
    void sendDirectMessage_Success() throws Exception {

        MessageResponse response = new MessageResponse();
        response.setContent("Hello");

        when(directMessageService.sendDirectMessage(
                anyLong(),
                any(MessageRequest.class),
                any()
        )).thenReturn(response);

        mockMvc.perform(post("/api/dm/2")
                        .with(user(testUser))
                        .contentType("application/json")
                        .content("""
                                {
                                  "content": "Hello"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").value("Hello"));

        // ✅ verify websocket send (optional but good)
        verify(messagingTemplate, times(2))
        .convertAndSend(anyString(), any(Object.class));
    }

    @Test
    void getDirectMessages_Success() throws Exception {

        when(directMessageService.getDirectMessages(
                anyLong(),
                anyInt(),
                anyInt(),
                any()
        )).thenReturn(new org.springframework.data.domain.PageImpl<>(Collections.emptyList()));

        mockMvc.perform(get("/api/dm/2")
                        .with(user(testUser))
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void markAsRead_Success() throws Exception {

        doNothing().when(directMessageService)
                .markAsRead(anyLong(), any());

        mockMvc.perform(post("/api/dm/2/read")
                        .with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}