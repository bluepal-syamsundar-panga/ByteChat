package com.bytechat.controllers;

import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.entity.User;
import com.bytechat.services.MessageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MessageControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MessageService messageService;

    @MockBean
    private SimpMessagingTemplate messagingTemplate;

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
    void getChannelMessages_Success() throws Exception {
        when(messageService.getRoomMessages(anyLong(), anyInt(), anyInt(), any())).thenReturn(new PageImpl<>(Collections.emptyList()));

        mockMvc.perform(get("/api/messages/channel/1").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void sendMessage_Success() throws Exception {
        MessageRequest request = new MessageRequest();
        request.setContent("Hello");
        
        MessageResponse response = MessageResponse.builder().id(1L).content("Hello").channelId(1L).build();
        when(messageService.sendMessage(anyLong(), any(MessageRequest.class), any())).thenReturn(response);

        mockMvc.perform(post("/api/messages/channel/1")
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").value("Hello"));
        
        verify(messagingTemplate).convertAndSend(eq("/topic/channel/1"), any(MessageResponse.class));
    }

    @Test
    void editMessage_Success() throws Exception {
        MessageRequest request = new MessageRequest();
        request.setContent("Updated");

        MessageResponse response = MessageResponse.builder().id(1L).content("Updated").channelId(1L).build();
        when(messageService.editMessage(anyLong(), any(MessageRequest.class), any())).thenReturn(response);

        mockMvc.perform(put("/api/messages/1")
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void pinMessage_Success() throws Exception {
        MessageResponse response = MessageResponse.builder().id(1L).isPinned(true).channelId(1L).build();
        when(messageService.pinMessage(anyLong(), any())).thenReturn(response);

        mockMvc.perform(post("/api/messages/1/pin").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
