package com.bytechat.services;

import com.bytechat.dto.request.CreateWorkspaceRequest;
import com.bytechat.dto.request.InviteUserRequest;
import com.bytechat.dto.response.WorkspaceResponse;
import com.bytechat.dto.response.UserResponse;
import com.bytechat.dto.response.WorkspaceCreationResponse;
import com.bytechat.entity.User;
import org.springframework.data.domain.Page;

import java.util.List;

public interface WorkspaceService {
    WorkspaceResponse createWorkspace(CreateWorkspaceRequest request, User currentUser);
    WorkspaceCreationResponse createWorkspaceWithDetails(CreateWorkspaceRequest request, String email, User currentUser);
    Page<WorkspaceResponse> getUserWorkspaces(User currentUser, int page, int size);
    void joinWorkspace(Long workspaceId, User currentUser);
    void leaveWorkspace(Long workspaceId, User currentUser);
    void archiveWorkspace(Long workspaceId, User currentUser);
    void inviteUser(Long workspaceId, String email, User currentUser);
    void inviteUser(Long workspaceId, InviteUserRequest request, User currentUser);
    void acceptInvite(Long notificationId, User currentUser);
    List<UserResponse> getWorkspaceMembers(Long workspaceId, User currentUser);
}
