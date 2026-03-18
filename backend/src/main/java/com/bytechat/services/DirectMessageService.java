package com.bytechat.services;

import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.entity.User;
import org.springframework.data.domain.Page;

public interface DirectMessageService {
    MessageResponse sendDirectMessage(Long toUserId, MessageRequest request, User sender);
    Page<MessageResponse> getDirectMessages(Long otherUserId, int page, int size, User currentUser);
    void markAsRead(Long otherUserId, User currentUser);
	MessageResponse reactToMessage(Long dmId, String emoji, User currentUser);
	MessageResponse pinMessage(Long dmId, User currentUser);
	MessageResponse deleteMessage(Long dmId, String scope, User currentUser);
	MessageResponse editMessage(Long dmId, String content, User currentUser);
}
