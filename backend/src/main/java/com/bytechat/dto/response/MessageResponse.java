package com.bytechat.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class MessageResponse {
    private Long id;
    private Long roomId;
    private Long channelId;
    private Long senderId;
    private Long recipientId;
    private String senderName;
    private String senderAvatar;
    private String content;
    private String type;
    @JsonProperty("isDeleted")
    private boolean isDeleted;
    @JsonProperty("isPinned")
    private boolean isPinned;
    private Long pinnedByUserId;
    private String pinnedByName;
    private LocalDateTime editedAt;
    private LocalDateTime sentAt;
    private List<Long> mentionedUserIds;
    private List<ReactionResponse> reactions;
    private int readCount;
    private List<MessageReadUserResponse> readBy;
    private Long replyToMessageId;
    private String replyToContent;
    private String replyToSenderName;
}
