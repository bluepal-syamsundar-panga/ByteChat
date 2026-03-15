package com.bytechat.controllers;

import com.bytechat.dto.response.ApiResponse;
import com.bytechat.dto.request.CreateRoomRequest;
import com.bytechat.dto.request.InviteUserRequest;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.dto.response.RoomResponse;
import com.bytechat.dto.response.UserResponse;
import com.bytechat.entity.User;
import com.bytechat.services.MessageService;
import com.bytechat.services.RoomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Rooms", description = "Endpoints for creating and retrieving chat rooms")
public class RoomController {

    private final RoomService roomService;
    private final MessageService messageService;

    @PostMapping
    @Operation(summary = "Create room", description = "Creates a new chat room.")
    public ResponseEntity<ApiResponse<RoomResponse>> createRoom(
            @Valid @RequestBody CreateRoomRequest request,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            log.warn("Unauthorized attempt to create room");
            return ResponseEntity.status(401).body(ApiResponse.error("User not authenticated"));
        }
        log.info("User {} creating room: {}", currentUser.getId(), request.getName());
        RoomResponse response = roomService.createRoom(request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Room created successfully"));
    }

    @GetMapping
    @Operation(summary = "Get user rooms", description = "Retrieves rooms the current user belongs to.")
    public ResponseEntity<ApiResponse<Page<RoomResponse>>> getUserRooms(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            log.warn("Unauthorized request to fetch rooms");
            return ResponseEntity.status(401).body(ApiResponse.error("User not authenticated"));
        }
        log.info("Fetching rooms for user {} (page: {}, size: {})", currentUser.getId(), page, size);
        Page<RoomResponse> rooms = roomService.getUserRooms(currentUser, page, size);
        return ResponseEntity.ok(ApiResponse.success(rooms, "Rooms fetched successfully"));
    }

    @PostMapping("/{roomId}/join")
    public ResponseEntity<ApiResponse<Void>> joinRoom(
            @PathVariable(name = "roomId") Long roomId,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("User not authenticated"));
        }
        roomService.joinRoom(roomId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Joined room successfully"));
    }

    @PostMapping("/{roomId}/leave")
    public ResponseEntity<ApiResponse<Void>> leaveRoom(
            @PathVariable(name = "roomId") Long roomId,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("User not authenticated"));
        }
        roomService.leaveRoom(roomId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Left room successfully"));
    }

    @PostMapping("/{roomId}/archive")
    public ResponseEntity<ApiResponse<Void>> archiveRoom(
            @PathVariable(name = "roomId") Long roomId,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("User not authenticated"));
        }
        roomService.archiveRoom(roomId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Room archived successfully"));
    }

    @PostMapping("/{roomId}/invite")
    public ResponseEntity<ApiResponse<Void>> inviteUser(
            @PathVariable(name = "roomId") Long roomId,
            @Valid @RequestBody InviteUserRequest request,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("User not authenticated"));
        }
        roomService.inviteUser(roomId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Invitation sent"));
    }

    @GetMapping("/{roomId}/members")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getRoomMembers(
            @PathVariable(name = "roomId") Long roomId,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("User not authenticated"));
        }
        return ResponseEntity.ok(ApiResponse.success(roomService.getRoomMembers(roomId, currentUser), "Room members fetched"));
    }

    @GetMapping("/{roomId}/messages")
    @Operation(summary = "Get room messages", description = "Retrieves a paginated list of messages for a specific room.")
    public ResponseEntity<ApiResponse<Page<MessageResponse>>> getRoomMessages(
            @PathVariable(name = "roomId") Long roomId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("User not authenticated"));
        }
        Page<MessageResponse> messages = messageService.getRoomMessages(roomId, page, size, currentUser);
        return ResponseEntity.ok(ApiResponse.success(messages, "Messages fetched successfully"));
    }
}
