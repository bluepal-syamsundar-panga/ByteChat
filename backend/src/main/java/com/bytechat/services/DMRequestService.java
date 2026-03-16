package com.bytechat.services;

import com.bytechat.entity.DMRequest;
import com.bytechat.entity.User;

import java.util.List;

public interface DMRequestService {
    DMRequest sendRequest(Long workspaceId, User sender, Long receiverId);
    DMRequest acceptRequest(User receiver, Long requestId);
    void rejectRequest(User receiver, Long requestId);
    List<DMRequest> getPendingRequests(User user);
}
