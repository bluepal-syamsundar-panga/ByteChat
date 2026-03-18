package com.bytechat.controllers;

import com.bytechat.entity.Channel;
import com.bytechat.entity.Message;
import com.bytechat.repository.MessageRepository;
import com.bytechat.services.MessageService;
import com.bytechat.services.ReactionService;
import com.bytechat.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReactionControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ReactionService reactionService;

    @MockBean
    private MessageService messageService;

    @MockBean
    private MessageRepository messageRepository;

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
    void addReaction_Success() throws Exception {
        Message message = Message.builder().id(1L).channel(Channel.builder().id(1L).build()).build();
        when(messageRepository.findById(1L)).thenReturn(Optional.of(message));
        
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

        mockMvc.perform(get("/api/messages/1/reactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
