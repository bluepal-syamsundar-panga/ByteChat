package com.bytechat.services;

import com.bytechat.dto.response.CursorPageResponse;
import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.dto.response.UserResponse;
import com.bytechat.entity.User;

import java.time.LocalDateTime;

public interface DirectMessageService {
    MessageResponse sendDirectMessage(Long toUserId, MessageRequest request, User sender);
    CursorPageResponse<MessageResponse> getDirectMessages(Long otherUserId, LocalDateTime cursorSentAt, Long cursorId, int size, User currentUser);
    UserResponse getConversationParticipant(Long otherUserId, User currentUser);
    void markAsRead(Long otherUserId, User currentUser);
	MessageResponse reactToMessage(Long dmId, String emoji, User currentUser);
	MessageResponse pinMessage(Long dmId, User currentUser);
	MessageResponse deleteMessage(Long dmId, String scope, User currentUser);
	MessageResponse editMessage(Long dmId, String content, User currentUser);
}
