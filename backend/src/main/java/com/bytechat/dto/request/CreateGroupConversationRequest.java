package com.bytechat.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CreateGroupConversationRequest {
    private Long workspaceId;

    @NotBlank
    private String name;

    @NotEmpty
    private List<Long> memberIds;
}
