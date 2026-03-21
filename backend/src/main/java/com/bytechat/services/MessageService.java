package com.bytechat.services;

import com.bytechat.dto.response.CursorPageResponse;
import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.entity.User;

import java.time.LocalDateTime;

public interface MessageService {
    MessageResponse sendMessage(Long channelId, MessageRequest request, User sender);
    CursorPageResponse<MessageResponse> getRoomMessages(Long channelId, LocalDateTime cursorSentAt, Long cursorId, int size, User currentUser);
    MessageResponse getMessageResponse(Long messageId, User currentUser);
    MessageResponse editMessage(Long messageId, MessageRequest request, User currentUser);
    MessageResponse deleteMessage(Long messageId, String scope, User currentUser);
    MessageResponse pinMessage(Long messageId, User currentUser);
    MessageResponse reactToMessage(Long messageId, String emoji, User currentUser);
    void markAsRead(Long messageId, User currentUser);
    void markChannelAsRead(Long channelId, User currentUser);
}
