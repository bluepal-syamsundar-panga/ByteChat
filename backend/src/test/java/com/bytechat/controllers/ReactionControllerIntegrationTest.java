package com.bytechat.controllers;

import com.bytechat.AbstractIntegrationTest;
import com.bytechat.config.TestWebSocketConfig;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.entity.User;
import com.bytechat.services.MessageService;
import com.bytechat.services.ReactionService;
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
class ReactionControllerIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ReactionService reactionService;

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
    void addReaction_Success() throws Exception {
        com.bytechat.entity.Reaction reaction = new com.bytechat.entity.Reaction();
        when(reactionService.addReaction(anyLong(), anyLong(), anyString())).thenReturn(reaction);
        MessageResponse response = MessageResponse.builder().id(1L).channelId(1L).build();
        when(messageService.getMessageResponse(anyLong(), any(com.bytechat.entity.User.class))).thenReturn(response);

        mockMvc.perform(post("/api/messages/1/reactions")
                        .with(user(testUser))
                        .param("emoji", "👍"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void getMessageReactions_Success() throws Exception {
        when(reactionService.getReactionsForMessage(anyLong())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/messages/1/reactions").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
