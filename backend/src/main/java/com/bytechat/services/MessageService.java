package com.bytechat.services;

import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.entity.User;
import org.springframework.data.domain.Page;

public interface MessageService {
    MessageResponse sendMessage(Long roomId, MessageRequest request, User sender);
    Page<MessageResponse> getRoomMessages(Long roomId, int page, int size, User currentUser);
    MessageResponse editMessage(Long messageId, MessageRequest request, User currentUser);
    void deleteMessage(Long messageId, User currentUser);
    MessageResponse pinMessage(Long messageId, User currentUser);
}
