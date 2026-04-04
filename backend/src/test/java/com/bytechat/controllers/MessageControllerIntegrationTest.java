package com.bytechat.controllers;

import com.bytechat.config.TestWebSocketConfig;
import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.CursorPageResponse;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.entity.User;
import com.bytechat.services.MessageService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bytechat.AbstractIntegrationTest;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestWebSocketConfig.class)
class MessageControllerIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MessageService messageService;

    @MockBean
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

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
        when(messageService.getRoomMessages(anyLong(), any(), any(), anyInt(), any()))
                .thenReturn(CursorPageResponse.<MessageResponse>builder().items(Collections.emptyList()).build());

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

    @Test
    void deleteMessage_Success() throws Exception {
        MessageResponse response = MessageResponse.builder().id(1L).channelId(1L).build();
        when(messageService.deleteMessage(anyLong(), anyString(), any())).thenReturn(response);
        mockMvc.perform(delete("/api/messages/1")
                        .with(user(testUser))
                        .param("scope", "all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void markAsRead_Success() throws Exception {
        mockMvc.perform(post("/api/messages/1/read")
                        .with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void markChannelAsRead_Success() throws Exception {
        mockMvc.perform(post("/api/messages/channel/1/read")
                        .with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // Removed non-existent reactToMessage endpoint test
}
