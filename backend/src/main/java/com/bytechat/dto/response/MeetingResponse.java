package com.bytechat.dto.response;

import com.bytechat.entity.Meeting;
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
public class MeetingResponse {
    private Long id;
    private Long channelId;
    private Long workspaceId;
    private String channelName;
    private String title;
    private String roomKey;
    private UserResponse creator;
    @JsonProperty("isActive")
    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime endedAt;

    public static MeetingResponse fromEntity(Meeting meeting) {
        return MeetingResponse.builder()
                .id(meeting.getId())
                .channelId(meeting.getChannel().getId())
                .workspaceId(meeting.getWorkspace().getId())
                .channelName(meeting.getChannel().getName())
                .title(meeting.getTitle())
                .roomKey(meeting.getRoomKey())
                .creator(UserResponse.builder()
                        .id(meeting.getCreator().getId())
                        .email(meeting.getCreator().getEmail())
                        .displayName(meeting.getCreator().getDisplayName())
                        .avatarUrl(meeting.getCreator().getAvatarUrl())
                        .online(meeting.getCreator().isOnline())
                        .role(meeting.getCreator().getRole() != null ? meeting.getCreator().getRole().name() : "MEMBER")
                        .build())
                .isActive(meeting.isActive())
                .createdAt(meeting.getCreatedAt())
                .endedAt(meeting.getEndedAt())
                .build();
    }
}
