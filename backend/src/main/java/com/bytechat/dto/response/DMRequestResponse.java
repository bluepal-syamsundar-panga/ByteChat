package com.bytechat.dto.response;

import com.bytechat.entity.DMRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DMRequestResponse {
    private Long id;
    private Long workspaceId;
    private UserResponse sender;
    private UserResponse receiver;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;

    public static DMRequestResponse fromEntity(DMRequest request) {
        return DMRequestResponse.builder()
                .id(request.getId())
                .workspaceId(request.getWorkspace() != null ? request.getWorkspace().getId() : null)
                .sender(UserResponse.builder()
                        .id(request.getSender().getId())
                        .displayName(request.getSender().getDisplayName())
                        .email(request.getSender().getEmail())
                        .avatarUrl(request.getSender().getAvatarUrl())
                        .build())
                .receiver(UserResponse.builder()
                        .id(request.getReceiver().getId())
                        .displayName(request.getReceiver().getDisplayName())
                        .email(request.getReceiver().getEmail())
                        .avatarUrl(request.getReceiver().getAvatarUrl())
                        .build())
                .status(request.getStatus().name())
                .createdAt(request.getCreatedAt())
                .respondedAt(request.getRespondedAt())
                .build();
    }
}
