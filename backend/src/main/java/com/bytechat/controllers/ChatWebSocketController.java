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

    @MessageMapping("/chat/channel/{channelId}")
    public void sendMessageToChannel(@DestinationVariable Long channelId, 
                                     @Payload MessageRequest chatMessage,
                                     SimpMessageHeaderAccessor headerAccessor) {
                                     
        if (headerAccessor.getUser() == null || headerAccessor.getUser().getName() == null) {
            log.warn("WebSocket message received without authenticated user for channel: {}", channelId);
            return;
        }
        String email = headerAccessor.getUser().getName();
        
        User sender = userRepository.findByEmail(email).orElse(null);
        if (sender == null) return;
        
        // Save to postgres via service (MessageService now uses channelId)
        MessageResponse savedMessage = messageService.sendMessage(channelId, chatMessage, sender);
        
        // Broadcast to clients listening on this channel topic
        messagingTemplate.convertAndSend("/topic/channel/" + channelId, savedMessage);
    }

    @MessageMapping("/chat/room/{roomId}")
    public void sendMessageToRoom(@DestinationVariable Long roomId, 
                                  @Payload MessageRequest chatMessage,
                                  SimpMessageHeaderAccessor headerAccessor) {
                                  
        String email = headerAccessor.getUser() != null ? headerAccessor.getUser().getName() : null;
        if (email == null) return;
        
        User sender = userRepository.findByEmail(email).orElse(null);
        if (sender == null) return;
        
        // This is for backward compatibility or workspace-wide announcements?
        // Let's assume for now rooms don't carry messages directly anymore, or they use a default channel.
        // Actually, I'll keep it but it might need to link to a default channel.
        // For now, I'll just keep it as is, but focusing on channels.
    }

    @MessageMapping("/chat/typing")
    public void handleTyping(@Payload Map<String, Object> payload,
                             SimpMessageHeaderAccessor headerAccessor) {
        Long roomId = payload.get("roomId") != null ? Long.valueOf(payload.get("roomId").toString()) : null;
        Long channelId = payload.get("channelId") != null ? Long.valueOf(payload.get("channelId").toString()) : null;
        
        if (channelId != null) {
            messagingTemplate.convertAndSend("/topic/channel/" + channelId + "/typing", payload);
        } else if (roomId != null) {
            messagingTemplate.convertAndSend("/topic/room/" + roomId + "/typing", payload);
        }
    }
}
