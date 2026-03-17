package com.bytechat.services;

import com.bytechat.dto.response.ChannelResponse;
import com.bytechat.dto.response.UserResponse;
import com.bytechat.entity.Channel;
import com.bytechat.entity.User;

import java.util.List;

public interface ChannelService {
    ChannelResponse createChannel(Long workspaceId, String name, String description, boolean isPrivate, boolean isDefault, User currentUser);
    List<ChannelResponse> getWorkspaceChannels(Long workspaceId, User currentUser);
    List<ChannelResponse> getArchivedChannels(Long workspaceId, User currentUser);
    List<ChannelResponse> getDeletedChannels(Long workspaceId, User currentUser);
    Channel getChannel(Long channelId);
    void addMember(Long channelId, User user);
    List<UserResponse> getChannelMembers(Long channelId);
    void inviteUser(Long channelId, String email, User currentUser);
    void acceptInvite(Long notificationId, User currentUser);
    void archiveChannel(Long channelId, User currentUser);
    void leaveChannel(Long channelId, User currentUser);
    void deleteChannel(Long channelId, User currentUser); // Now soft delete
    void permanentlyDeleteChannel(Long channelId, User currentUser);
    void restoreChannel(Long channelId, User currentUser);
    void transferOwnership(Long channelId, Long newOwnerId, User currentUser);
}
