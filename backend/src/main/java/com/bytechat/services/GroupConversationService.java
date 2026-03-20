package com.bytechat.services;

import com.bytechat.dto.request.CreateGroupConversationRequest;
import com.bytechat.dto.request.GroupConversationInviteRequest;
import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.GroupConversationInviteResponse;
import com.bytechat.dto.response.GroupConversationResponse;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.entity.User;
import org.springframework.data.domain.Page;

import java.util.List;

public interface GroupConversationService {
    GroupConversationResponse createConversation(CreateGroupConversationRequest request, User currentUser);
    List<GroupConversationResponse> getUserGroups(User currentUser);
    GroupConversationResponse getConversation(Long groupId, User currentUser);
    List<GroupConversationInviteResponse> getPendingInvites(User currentUser);
    GroupConversationInviteResponse acceptInvite(Long inviteId, User currentUser);
    void rejectInvite(Long inviteId, User currentUser);
    GroupConversationResponse inviteMembers(Long groupId, GroupConversationInviteRequest request, User currentUser);
    void leaveConversation(Long groupId, User currentUser);
    void deleteConversation(Long groupId, User currentUser);
    void removeMember(Long groupId, Long userId, User currentUser);
    MessageResponse editMessage(Long messageId, String content, User currentUser);
    MessageResponse deleteMessage(Long messageId, String scope, User currentUser);
    MessageResponse pinMessage(Long messageId, User currentUser);
    MessageResponse reactToMessage(Long messageId, String emoji, User currentUser);
    Page<MessageResponse> getMessages(Long groupId, int page, int size, User currentUser);
    MessageResponse sendMessage(Long groupId, MessageRequest request, User currentUser);
    void markAsRead(Long groupId, User currentUser);
}
