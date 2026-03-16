package com.bytechat.services;

import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.entity.User;
import org.springframework.data.domain.Page;

public interface MessageService {
    MessageResponse sendMessage(Long channelId, MessageRequest request, User sender);
    Page<MessageResponse> getRoomMessages(Long channelId, int page, int size, User currentUser);
    MessageResponse editMessage(Long messageId, MessageRequest request, User currentUser);
    MessageResponse deleteMessage(Long messageId, User currentUser);
    MessageResponse pinMessage(Long messageId, User currentUser);
    void markAsRead(Long messageId, User currentUser);
}
