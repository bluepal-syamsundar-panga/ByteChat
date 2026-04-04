package com.bytechat.controllers;

import com.bytechat.AbstractIntegrationTest;
import com.bytechat.config.TestWebSocketConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@SpringBootTest
@Import(TestWebSocketConfig.class)
class TypingControllerIntegrationTest extends AbstractIntegrationTest {

    @MockBean
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private TypingController typingController;

    @Test
    void handleTyping_Success() {
        TypingController.TypingEvent event = new TypingController.TypingEvent();
        event.setWorkspaceId("workspace123");
        event.setUserId(1L);
        event.setTyping(true);

        typingController.handleTyping(event);

        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/typing.workspace123"), eq(event));
    }

    @Test
    void handleTyping_InvalidEvent_DoesNotSend() {
        TypingController.TypingEvent event = new TypingController.TypingEvent();
        event.setWorkspaceId(null);

        typingController.handleTyping(event);

        verify(messagingTemplate, times(0)).convertAndSend(anyString(), eq(event));
    }
}
