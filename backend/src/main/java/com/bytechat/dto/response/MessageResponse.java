package com.bytechat.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MessageResponse {
    private Long id;
    private Long roomId;
    private Long senderId;
    private String senderName;
    private String senderAvatar;
    private String content;
    private String type;
    private boolean isDeleted;
    private boolean isPinned;
    private LocalDateTime editedAt;
    private LocalDateTime sentAt;
    private List<Long> mentionedUserIds;
    private List<ReactionResponse> reactions;
}
