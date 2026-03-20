package com.bytechat.dto.response;

import com.bytechat.entity.GroupConversationInvite;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupConversationInviteResponse {
    private Long id;
    private Long groupConversationId;
    private String groupName;
    private Long workspaceId;
    private UserResponse inviter;
    private LocalDateTime createdAt;

    public static GroupConversationInviteResponse fromEntity(GroupConversationInvite invite) {
        return GroupConversationInviteResponse.builder()
                .id(invite.getId())
                .groupConversationId(invite.getGroupConversation().getId())
                .groupName(invite.getGroupConversation().getName())
                .workspaceId(invite.getGroupConversation().getWorkspace().getId())
                .inviter(UserResponse.builder()
                        .id(invite.getInviter().getId())
                        .email(invite.getInviter().getEmail())
                        .displayName(invite.getInviter().getDisplayName())
                        .avatarUrl(invite.getInviter().getAvatarUrl())
                        .online(invite.getInviter().isOnline())
                        .role(invite.getInviter().getRole() != null ? invite.getInviter().getRole().name() : "MEMBER")
                        .build())
                .createdAt(invite.getCreatedAt())
                .build();
    }
}
