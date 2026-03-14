package com.bytechat.controllers;

import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.entity.User;
import com.bytechat.repository.UserRepository;
import com.bytechat.services.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    @MessageMapping("/chat.room.{roomId}")
    public void sendMessageToRoom(@DestinationVariable Long roomId, 
                                  @Payload MessageRequest chatMessage,
                                  SimpMessageHeaderAccessor headerAccessor) {
                                  
        // Ideally handled by an interceptor reading JWT, but as an example, fetch user identity from STOMP
        String email = headerAccessor.getUser() != null ? headerAccessor.getUser().getName() : null;
        if (email == null) return;
        
        User sender = userRepository.findByEmail(email).orElse(null);
        if (sender == null) return;
        
        // Save to postgres via service
        MessageResponse savedMessage = messageService.sendMessage(roomId, chatMessage, sender);
        
        // Broadcast to clients listening on this room topic
        messagingTemplate.convertAndSend("/topic/room." + roomId, savedMessage);
    }
}
