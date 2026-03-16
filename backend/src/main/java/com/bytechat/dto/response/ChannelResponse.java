package com.bytechat.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChannelResponse {
    private Long id;
    private String name;
    private String description;
    private Long workspaceId;
    private boolean isPrivate;
    private boolean isArchived;
    private LocalDateTime createdAt;
    private int memberCount;
}
