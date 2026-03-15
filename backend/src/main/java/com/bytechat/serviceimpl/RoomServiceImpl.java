package com.bytechat.serviceimpl;

import com.bytechat.dto.request.CreateRoomRequest;
import com.bytechat.dto.request.InviteUserRequest;
import com.bytechat.dto.response.RoomResponse;
import com.bytechat.dto.response.UserResponse;
import com.bytechat.entity.Notification;
import com.bytechat.entity.Room;
import com.bytechat.entity.RoomMember;
import com.bytechat.entity.User;
import com.bytechat.repository.NotificationRepository;
import com.bytechat.repository.RoomMemberRepository;
import com.bytechat.repository.RoomRepository;
import com.bytechat.repository.UserRepository;
import com.bytechat.services.NotificationService;
import com.bytechat.services.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;

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
    @Transactional(readOnly = true)
    public Page<RoomResponse> getUserRooms(User currentUser, int page, int size) {
        return roomRepository.findJoinedRooms(currentUser.getId(), PageRequest.of(page, size))
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

    @Override
    @Transactional
    public void inviteUser(Long roomId, InviteUserRequest request, User currentUser) {
        Room room = getRoomOrThrow(roomId);
        ensureRoomOwner(room, currentUser);

        User invitedUser = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found with that email"));

        if (roomMemberRepository.existsByRoomIdAndUserId(roomId, invitedUser.getId())) {
            throw new RuntimeException("User is already in this room");
        }

        notificationService.sendNotification(
                invitedUser.getId(),
                "ROOM_INVITE",
                currentUser.getDisplayName() + " invited you to join #" + room.getName(),
                room.getId()
        );
    }

    @Override
    @Transactional
    public void acceptInvite(Long notificationId, User currentUser) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getRecipient().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Cannot accept another user's invite");
        }

        if (!"ROOM_INVITE".equals(notification.getType())) {
            throw new RuntimeException("Notification is not a room invite");
        }

        Long roomId = notification.getRelatedEntityId();
        if (roomId == null) {
            throw new RuntimeException("Invite notification is missing room information");
        }

        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, currentUser.getId())) {
            Room room = getRoomOrThrow(roomId);
            roomMemberRepository.save(RoomMember.builder()
                    .room(room)
                    .user(currentUser)
                    .build());
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getRoomMembers(Long roomId, User currentUser) {
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, currentUser.getId())) {
            throw new RuntimeException("You are not a member of this room");
        }

        return roomMemberRepository.findByRoomId(roomId).stream()
                .map(RoomMember::getUser)
                .map(this::mapUser)
                .toList();
    }

    private Room getRoomOrThrow(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
    }

    private void ensureRoomOwner(Room room, User currentUser) {
        if (!room.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only the room owner can invite people");
        }
    }

    private RoomResponse mapToResponse(Room room) {
        if (room == null) return null;
        return RoomResponse.builder()
                .id(room.getId())
                .name(room.getName())
                .description(room.getDescription())
                .isPrivate(room.isPrivate())
                .isArchived(room.isArchived())
                .createdById(room.getCreatedBy() != null ? room.getCreatedBy().getId() : null)
                .createdAt(room.getCreatedAt())
                .build();
    }

    private UserResponse mapUser(User user) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .lastSeen(user.getLastSeen())
                .online(user.isOnline())
                .role(user.getRole() != null ? user.getRole().name() : "MEMBER")
                .build();
    }
}
