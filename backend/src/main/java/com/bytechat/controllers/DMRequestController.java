package com.bytechat.controllers;

import com.bytechat.dto.response.ApiResponse;
import com.bytechat.dto.response.DMRequestResponse;
import com.bytechat.entity.DMRequest;
import com.bytechat.entity.User;
import com.bytechat.services.DMRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dm/requests")
@RequiredArgsConstructor
public class DMRequestController {

    private final DMRequestService dmRequestService;

    @PostMapping("/send/{receiverId}")
    public ResponseEntity<ApiResponse<DMRequestResponse>> sendRequest(
            @PathVariable(name = "receiverId") Long receiverId,
            @AuthenticationPrincipal User sender) {
        DMRequest request = dmRequestService.sendRequest(sender, receiverId);
        return ResponseEntity.ok(ApiResponse.success(DMRequestResponse.fromEntity(request), "DM request sent successfully"));
    }

    @PostMapping("/accept/{requestId}")
    public ResponseEntity<ApiResponse<DMRequestResponse>> acceptRequest(
            @PathVariable(name = "requestId") Long requestId,
            @AuthenticationPrincipal User receiver) {
        DMRequest request = dmRequestService.acceptRequest(receiver, requestId);
        return ResponseEntity.ok(ApiResponse.success(DMRequestResponse.fromEntity(request), "DM request accepted"));
    }

    @PostMapping("/reject/{requestId}")
    public ResponseEntity<ApiResponse<Void>> rejectRequest(
            @PathVariable(name = "requestId") Long requestId,
            @AuthenticationPrincipal User receiver) {
        dmRequestService.rejectRequest(receiver, requestId);
        return ResponseEntity.ok(ApiResponse.success(null, "DM request rejected"));
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<DMRequestResponse>>> getPendingRequests(
            @AuthenticationPrincipal User user) {
        List<DMRequest> requests = dmRequestService.getPendingRequests(user);
        List<DMRequestResponse> responses = requests.stream()
                .map(DMRequestResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(responses, "Pending requests fetched"));
    }
}
