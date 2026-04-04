package com.bytechat.controllers;

import com.bytechat.AbstractIntegrationTest;
import com.bytechat.config.TestWebSocketConfig;
import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.entity.User;
import com.bytechat.repository.UserRepository;
import com.bytechat.services.MessageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.security.Principal;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest
@Import(TestWebSocketConfig.class)
class ChatWebSocketControllerIntegrationTest extends AbstractIntegrationTest {

    @MockBean
    private MessageService messageService;

    @MockBean
    private SimpMessagingTemplate messagingTemplate;

    @MockBean
    private UserRepository userRepository;

    @Autowired
    private ChatWebSocketController chatWebSocketController;

    @Test
    void sendMessageToChannel_Success() {
        MessageRequest request = new MessageRequest();
        request.setContent("Hello Channel");

        User sender = User.builder().id(1L).email("test@example.com").build();
        MessageResponse response = MessageResponse.builder().id(1L).content("Hello Channel").build();

        SimpMessageHeaderAccessor headerAccessor = mock(SimpMessageHeaderAccessor.class);
        Principal principal = mock(Principal.class);

        when(headerAccessor.getUser()).thenReturn(principal);
        when(principal.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(sender));
        when(messageService.sendMessage(eq(1L), eq(request), eq(sender))).thenReturn(response);

        chatWebSocketController.sendMessageToChannel(1L, request, headerAccessor);

        verify(messageService, times(1)).sendMessage(eq(1L), eq(request), eq(sender));
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/channel/1"), eq(response));
    }
}
