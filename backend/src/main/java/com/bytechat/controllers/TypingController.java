package com.bytechat.controllers;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
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
        if (event == null || event.getWorkspaceId() == null || event.getWorkspaceId().isBlank()) {
            return;
        }

        messagingTemplate.convertAndSend("/topic/typing." + event.getWorkspaceId(), event);
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TypingEvent {
        private String workspaceId;
        private Long userId;
        private String displayName;
        private String avatar;
        @JsonProperty("isTyping")
        @JsonAlias({"typing"})
        private boolean isTyping;
        private Long channelId;
        private Long roomId;
        private Long targetUserId;
    }
}
