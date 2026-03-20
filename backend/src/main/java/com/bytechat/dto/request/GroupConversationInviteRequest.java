package com.bytechat.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class GroupConversationInviteRequest {
    @NotEmpty
    private List<Long> memberIds;
}
