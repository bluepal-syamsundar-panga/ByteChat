package com.bytechat.services;

import com.bytechat.dto.response.MeetingResponse;
import com.bytechat.entity.User;

import java.util.List;

public interface MeetingService {
    MeetingResponse createMeeting(Long channelId, String title, String password, User currentUser);
    List<MeetingResponse> getActiveWorkspaceMeetings(Long workspaceId, User currentUser);
    MeetingResponse joinMeeting(Long meetingId, String password, User currentUser);
    void endMeeting(Long meetingId, User currentUser);
}
