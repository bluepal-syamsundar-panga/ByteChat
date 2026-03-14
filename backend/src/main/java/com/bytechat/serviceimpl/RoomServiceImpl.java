package com.bytechat.serviceimpl;

import com.bytechat.dto.request.CreateRoomRequest;
import com.bytechat.dto.response.RoomResponse;
import com.bytechat.entity.Room;
import com.bytechat.entity.RoomMember;
import com.bytechat.entity.User;
import com.bytechat.repository.RoomMemberRepository;
import com.bytechat.repository.RoomRepository;
import com.bytechat.services.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;

    @Override
    @Transactional
    public RoomResponse createRoom(CreateRoomRequest request, User currentUser) {
        Room room = Room.builder()
                .name(request.getName())
                .description(request.getDescription())
                .isPrivate(request.isPrivate())
                .createdBy(currentUser)
                .build();
                
        room = roomRepository.save(room);
        
        // Add creator as member automatically
        RoomMember member = RoomMember.builder()
                .room(room)
                .user(currentUser)
                .build();
        roomMemberRepository.save(member);
        
        return mapToResponse(room);
    }

    @Override
    public Page<RoomResponse> getPublicRooms(int page, int size) {
        return roomRepository.findByIsPrivateFalseAndIsArchivedFalse(PageRequest.of(page, size))
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public void joinRoom(Long roomId, User currentUser) {
        Room room = getRoomOrThrow(roomId);
        
        if (room.isArchived()) {
            throw new RuntimeException("Cannot join archived room");
        }
        
        if (room.isPrivate() && !room.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Cannot join private room without invite (Not Implemented Here)");
        }
        
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, currentUser.getId())) {
            RoomMember member = RoomMember.builder()
                    .room(room)
                    .user(currentUser)
                    .build();
            roomMemberRepository.save(member);
        }
    }

    @Override
    @Transactional
    public void leaveRoom(Long roomId, User currentUser) {
        roomMemberRepository.findByRoomIdAndUserId(roomId, currentUser.getId())
                .ifPresent(roomMemberRepository::delete);
    }

    @Override
    @Transactional
    public void archiveRoom(Long roomId, User currentUser) {
        Room room = getRoomOrThrow(roomId);
        
        if (!room.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only creator can archive the room");
        }
        
        room.setArchived(true);
        roomRepository.save(room);
    }

    private Room getRoomOrThrow(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
    }

    private RoomResponse mapToResponse(Room room) {
        return RoomResponse.builder()
                .id(room.getId())
                .name(room.getName())
                .description(room.getDescription())
                .isPrivate(room.isPrivate())
                .isArchived(room.isArchived())
                .createdById(room.getCreatedBy().getId())
                .createdAt(room.getCreatedAt())
                .build();
    }
}
