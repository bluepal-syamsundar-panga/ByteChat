package com.bytechat.services;

import com.bytechat.dto.request.CreateRoomRequest;
import com.bytechat.dto.response.RoomResponse;
import com.bytechat.dto.request.InviteUserRequest;
import com.bytechat.dto.response.UserResponse;
import com.bytechat.entity.User;
import org.springframework.data.domain.Page;

import java.util.List;

public interface RoomService {
    RoomResponse createRoom(CreateRoomRequest request, User currentUser);
    Page<RoomResponse> getUserRooms(User currentUser, int page, int size);
    void joinRoom(Long roomId, User currentUser);
    void leaveRoom(Long roomId, User currentUser);
    void archiveRoom(Long roomId, User currentUser);
    void inviteUser(Long roomId, InviteUserRequest request, User currentUser);
    void acceptInvite(Long notificationId, User currentUser);
    List<UserResponse> getRoomMembers(Long roomId, User currentUser);
}
