package com.bytechat.controllers;

import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.entity.User;
import com.bytechat.repository.UserRepository;
import com.bytechat.services.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    @MessageMapping("/chat/room/{roomId}")
    public void sendMessageToRoom(@DestinationVariable Long roomId, 
                                  @Payload MessageRequest chatMessage,
                                  SimpMessageHeaderAccessor headerAccessor) {
                                  
        String email = headerAccessor.getUser() != null ? headerAccessor.getUser().getName() : null;
        if (email == null) {
            log.warn("WebSocket message received without authenticated user for room: {}", roomId);
            return;
        }
        
        User sender = userRepository.findByEmail(email).orElse(null);
        if (sender == null) return;
        
        // Save to postgres via service
        MessageResponse savedMessage = messageService.sendMessage(roomId, chatMessage, sender);
        
        // Broadcast to clients listening on this room topic
        messagingTemplate.convertAndSend("/topic/room/" + roomId, savedMessage);
    }

    @MessageMapping("/chat/typing")
    public void handleTyping(@Payload Map<String, Object> payload,
                             SimpMessageHeaderAccessor headerAccessor) {
        Long roomId = payload.get("roomId") != null ? Long.valueOf(payload.get("roomId").toString()) : null;
        if (roomId == null) return;

        // Broadcast typing status to everyone in the room
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/typing", payload);
    }
}
