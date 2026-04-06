package com.bytechat.controllers;

import com.bytechat.AbstractIntegrationTest;
import com.bytechat.config.TestWebSocketConfig;
import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.CursorPageResponse;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.dto.response.UserResponse;
import com.bytechat.entity.User;
import com.bytechat.services.DirectMessageService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestWebSocketConfig.class)
class DirectMessageControllerIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DirectMessageService directMessageService;

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
    void getDirectMessages_Success() throws Exception {
        when(directMessageService.getDirectMessages(anyLong(), any(), any(), anyInt(), any(com.bytechat.entity.User.class)))
                .thenReturn(CursorPageResponse.<MessageResponse>builder().items(Collections.emptyList()).build());

        mockMvc.perform(get("/api/dm/2").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void getConversationParticipant_Success() throws Exception {
        UserResponse participant = UserResponse.builder().id(2L).email("other@ex.com").build();
        when(directMessageService.getConversationParticipant(anyLong(), any(com.bytechat.entity.User.class))).thenReturn(participant);

        mockMvc.perform(get("/api/dm/2/participant").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("other@ex.com"));
    }

    @Test
    void sendDirectMessage_Success() throws Exception {
        MessageRequest request = new MessageRequest();
        request.setContent("Hello DM");

        MessageResponse response = MessageResponse.builder().id(100L).content("Hello DM").senderId(1L).build();
        when(directMessageService.sendDirectMessage(anyLong(), any(MessageRequest.class), any(com.bytechat.entity.User.class))).thenReturn(response);

        mockMvc.perform(post("/api/dm/2")
                        .with(user(testUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").value("Hello DM"));
    }

    @Test
    void editMessage_Success() throws Exception {
        MessageRequest request = new MessageRequest();
        request.setContent("Updated DM");

        MessageResponse response = MessageResponse.builder().id(100L).content("Updated DM").senderId(1L).build();
        when(directMessageService.editMessage(anyLong(), anyString(), any(com.bytechat.entity.User.class))).thenReturn(response);

        mockMvc.perform(put("/api/dm/100")
                        .with(user(testUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void deleteMessage_Success() throws Exception {
        MessageResponse response = MessageResponse.builder().id(100L).senderId(1L).build();
        when(directMessageService.deleteMessage(anyLong(), anyString(), any(com.bytechat.entity.User.class))).thenReturn(response);

        mockMvc.perform(delete("/api/dm/100")
                        .with(user(testUser))
                        .param("scope", "everyone"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void pinMessage_Success() throws Exception {
        MessageResponse response = MessageResponse.builder().id(100L).isPinned(true).senderId(1L).build();
        when(directMessageService.pinMessage(anyLong(), any(com.bytechat.entity.User.class))).thenReturn(response);

        mockMvc.perform(post("/api/dm/100/pin").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void reactToMessage_Success() throws Exception {
        MessageResponse response = MessageResponse.builder().id(100L).senderId(1L).build();
        when(directMessageService.reactToMessage(anyLong(), anyString(), any(com.bytechat.entity.User.class))).thenReturn(response);

        mockMvc.perform(post("/api/dm/100/react")
                        .with(user(testUser))
                        .param("emoji", "❤️"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void markAsRead_Success() throws Exception {
        doNothing().when(directMessageService).markAsRead(anyLong(), any(com.bytechat.entity.User.class));

        mockMvc.perform(post("/api/dm/2/read").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
