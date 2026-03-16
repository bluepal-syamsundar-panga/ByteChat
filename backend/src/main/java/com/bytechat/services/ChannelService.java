package com.bytechat.services;

import com.bytechat.dto.response.ChannelResponse;
import com.bytechat.dto.response.UserResponse;
import com.bytechat.entity.Channel;
import com.bytechat.entity.User;

import java.util.List;

public interface ChannelService {
    ChannelResponse createChannel(Long workspaceId, String name, String description, boolean isDefault, User currentUser);
    List<ChannelResponse> getWorkspaceChannels(Long workspaceId);
    Channel getChannel(Long channelId);
    void addMember(Long channelId, User user);
    List<UserResponse> getChannelMembers(Long channelId);
    void inviteUser(Long channelId, String email, User currentUser);
    void acceptInvite(Long notificationId, User currentUser);
    void archiveChannel(Long channelId, User currentUser);
}
