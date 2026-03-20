package com.bytechat.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupConversationResponse {
    private Long id;
    private Long workspaceId;
    private String name;
    private int memberCount;
    private long unreadCount;
    private LocalDateTime createdAt;
    private UserResponse createdBy;
    private List<UserResponse> members;
}
