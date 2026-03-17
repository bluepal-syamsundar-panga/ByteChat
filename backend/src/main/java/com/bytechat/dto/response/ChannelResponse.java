package com.bytechat.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    
    @JsonProperty("isPrivate")
    private boolean isPrivate;
    
    @JsonProperty("isArchived")
    private boolean isArchived;
    
    @JsonProperty("isDeleted")
    private boolean isDeleted;
    
    private LocalDateTime createdAt;
    private int memberCount;
    private UserResponse createdBy;
}
