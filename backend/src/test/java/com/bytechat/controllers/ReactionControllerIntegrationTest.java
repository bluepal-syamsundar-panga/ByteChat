package com.bytechat.controllers;

import com.bytechat.config.TestWebSocketConfig;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.entity.Channel;
import com.bytechat.entity.Message;
import com.bytechat.entity.User;
import com.bytechat.repository.MessageRepository;
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
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bytechat.AbstractIntegrationTest;

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
    private MessageRepository messageRepository;

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
        Message message = Message.builder().id(1L).channel(Channel.builder().id(1L).build()).build();
        when(messageRepository.findById(1L)).thenReturn(Optional.of(message));
        when(messageService.getMessageResponse(eq(1L), any()))
                .thenReturn(MessageResponse.builder().id(1L).channelId(1L).build());

        mockMvc.perform(post("/api/messages/1/reactions")
                        .with(user(testUser))
                        .param("emoji", "👍"))
                .andExpect(status().isOk());

        verify(reactionService).addReaction(eq(1L), any(), eq("👍"));
    }

    @Test
    void removeReaction_Success() throws Exception {
        mockMvc.perform(delete("/api/messages/1/reactions")
                        .with(user(testUser))
                        .param("emoji", "👍"))
                .andExpect(status().isOk());

        verify(reactionService).removeReaction(eq(1L), any(), eq("👍"));
    }

    @Test
    void getReactions_Success() throws Exception {
        when(reactionService.getReactionsForMessage(1L)).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/messages/1/reactions")
                        .with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
