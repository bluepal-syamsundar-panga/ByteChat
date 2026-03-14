package com.bytechat.services;

import com.bytechat.dto.request.CreateRoomRequest;
import com.bytechat.dto.response.RoomResponse;
import com.bytechat.entity.User;
import org.springframework.data.domain.Page;

public interface RoomService {
    RoomResponse createRoom(CreateRoomRequest request, User currentUser);
    Page<RoomResponse> getPublicRooms(int page, int size);
    void joinRoom(Long roomId, User currentUser);
    void leaveRoom(Long roomId, User currentUser);
    void archiveRoom(Long roomId, User currentUser);
}
