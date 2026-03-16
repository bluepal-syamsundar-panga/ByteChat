package com.bytechat.controllers;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class TypingController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload TypingEvent event) {
        // Broadcast typing event to the specific workspace
        messagingTemplate.convertAndSend("/topic/typing." + event.getWorkspaceId(), event);
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TypingEvent {
        private Long workspaceId;
        private Long userId;
        private String displayName;
        private boolean isTyping;
    }
}
