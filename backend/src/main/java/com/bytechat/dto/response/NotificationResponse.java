package com.bytechat.dto.response;

import com.bytechat.entity.Notification;
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
public class NotificationResponse {
    private Long id;
    private Long recipientId;
    private String type;
    private String content;
    private Long relatedEntityId;
    @JsonProperty("isRead")
    private boolean isRead;
    private LocalDateTime createdAt;

    public static NotificationResponse fromEntity(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .recipientId(notification.getRecipient().getId())
                .type(notification.getType())
                .content(notification.getContent())
                .relatedEntityId(notification.getRelatedEntityId())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
