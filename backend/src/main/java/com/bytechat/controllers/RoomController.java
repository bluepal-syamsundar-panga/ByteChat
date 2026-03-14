package com.bytechat.controllers;

import com.bytechat.dto.response.ApiResponse;
import com.bytechat.dto.request.CreateRoomRequest;
import com.bytechat.dto.response.RoomResponse;
import com.bytechat.entity.User;
import com.bytechat.services.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    public ResponseEntity<ApiResponse<RoomResponse>> createRoom(
            @Valid @RequestBody CreateRoomRequest request,
            @AuthenticationPrincipal User currentUser) {
        RoomResponse response = roomService.createRoom(request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Room created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<RoomResponse>>> getPublicRooms(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Page<RoomResponse> rooms = roomService.getPublicRooms(page, size);
        return ResponseEntity.ok(ApiResponse.success(rooms, "Rooms fetched successfully"));
    }

    @PostMapping("/{roomId}/join")
    public ResponseEntity<ApiResponse<Void>> joinRoom(
            @PathVariable Long roomId,
            @AuthenticationPrincipal User currentUser) {
        roomService.joinRoom(roomId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Joined room successfully"));
    }

    @PostMapping("/{roomId}/leave")
    public ResponseEntity<ApiResponse<Void>> leaveRoom(
            @PathVariable Long roomId,
            @AuthenticationPrincipal User currentUser) {
        roomService.leaveRoom(roomId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Left room successfully"));
    }

    @PostMapping("/{roomId}/archive")
    public ResponseEntity<ApiResponse<Void>> archiveRoom(
            @PathVariable Long roomId,
            @AuthenticationPrincipal User currentUser) {
        roomService.archiveRoom(roomId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Room archived successfully"));
    }
}
