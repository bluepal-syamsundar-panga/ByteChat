package com.bytechat.serviceimpl;

import com.bytechat.dto.response.MeetingResponse;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.entity.Channel;
import com.bytechat.entity.ChannelMember;
import com.bytechat.entity.Meeting;
import com.bytechat.entity.Message;
import com.bytechat.entity.User;
import com.bytechat.exception.ResourceNotFoundException;
import com.bytechat.exception.UnauthorizedException;
import com.bytechat.repository.ChannelMemberRepository;
import com.bytechat.repository.ChannelRepository;
import com.bytechat.repository.MeetingRepository;
import com.bytechat.repository.MessageRepository;
import com.bytechat.repository.WorkspaceMemberRepository;
import com.bytechat.services.MeetingService;
import com.bytechat.services.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MeetingServiceImpl implements MeetingService {

    private final MeetingRepository meetingRepository;
    private final ChannelRepository channelRepository;
    private final ChannelMemberRepository channelMemberRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;
    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public MeetingResponse createMeeting(Long channelId, String title, String password, User currentUser) {
        Channel channel = getAccessibleChannel(channelId, currentUser);
        meetingRepository.findFirstByChannelIdAndIsActiveTrueOrderByCreatedAtDesc(channelId)
                .ifPresent(existing -> {
                    throw new IllegalStateException("A live meeting is already running in this channel");
                });

        Meeting meeting = Meeting.builder()
                .channel(channel)
                .workspace(channel.getWorkspace())
                .creator(currentUser)
                .title(title.trim())
                .passwordHash(passwordEncoder.encode(password))
                .roomKey("bytechat-" + channelId + "-" + UUID.randomUUID())
                .build();

        Meeting savedMeeting = meetingRepository.save(meeting);

        List<ChannelMember> members = channelMemberRepository.findByChannelId(channelId);
        for (ChannelMember member : members) {
            Long recipientId = member.getUser().getId();
            if (!recipientId.equals(currentUser.getId())) {
                notificationService.sendNotification(
                        recipientId,
                        "MEETING_INVITE",
                        currentUser.getDisplayName() + " started \"" + savedMeeting.getTitle() + "\" in #" + channel.getName(),
                        savedMeeting.getId()
                );
            }
        }

        publishSystemMessage(channel, currentUser, currentUser.getDisplayName() + " created meeting \"" + savedMeeting.getTitle() + "\"");
        publishSystemMessage(channel, currentUser, "Meeting invite sent to #" + channel.getName());

        return MeetingResponse.fromEntity(savedMeeting);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MeetingResponse> getActiveWorkspaceMeetings(Long workspaceId, User currentUser) {
        if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, currentUser.getId())) {
            throw new UnauthorizedException("You are not a member of this workspace");
        }

        return meetingRepository.findByWorkspaceIdAndIsActiveTrueOrderByCreatedAtDesc(workspaceId)
                .stream()
                .filter(meeting -> channelMemberRepository.existsByChannelIdAndUserId(meeting.getChannel().getId(), currentUser.getId()))
                .map(MeetingResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MeetingResponse joinMeeting(Long meetingId, String password, User currentUser) {
        Meeting meeting = getActiveMeeting(meetingId);
        ensureChannelMembership(meeting.getChannel().getId(), currentUser.getId());

        if (!passwordEncoder.matches(password, meeting.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid meeting password");
        }

        return MeetingResponse.fromEntity(meeting);
    }

    @Override
    @Transactional
    public void endMeeting(Long meetingId, User currentUser) {
        Meeting meeting = getActiveMeeting(meetingId);
        if (!meeting.getCreator().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Only the meeting creator can end this meeting");
        }

        meeting.setActive(false);
        meeting.setEndedAt(LocalDateTime.now());
        meetingRepository.save(meeting);
        notificationService.markRelatedNotificationsAsReadForAll("MEETING_INVITE", meeting.getId());
        for (ChannelMember member : channelMemberRepository.findByChannelId(meeting.getChannel().getId())) {
            if (!member.getUser().getId().equals(currentUser.getId())) {
                notificationService.sendNotification(
                        member.getUser().getId(),
                        "MEETING_ENDED",
                        "Meeting \"" + meeting.getTitle() + "\" has ended in #" + meeting.getChannel().getName(),
                        meeting.getId()
                );
            }
        }
        publishSystemMessage(meeting.getChannel(), currentUser, currentUser.getDisplayName() + " ended meeting \"" + meeting.getTitle() + "\"");
        log.info("Meeting {} ended by user {}", meetingId, currentUser.getEmail());
    }

    private Channel getAccessibleChannel(Long channelId, User currentUser) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found"));
        ensureChannelMembership(channelId, currentUser.getId());
        return channel;
    }

    private Meeting getActiveMeeting(Long meetingId) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found"));
        if (!meeting.isActive()) {
            throw new IllegalStateException("This meeting has already ended");
        }
        return meeting;
    }

    private void ensureChannelMembership(Long channelId, Long userId) {
        if (!channelMemberRepository.existsByChannelIdAndUserId(channelId, userId)) {
            throw new UnauthorizedException("You are not a member of this channel");
        }
    }

    private void publishSystemMessage(Channel channel, User actor, String content) {
        Message message = Message.builder()
                .channel(channel)
                .sender(actor)
                .content(content)
                .type("SYSTEM")
                .mentionedUserIds(new ArrayList<>())
                .build();
        Message saved = messageRepository.saveAndFlush(message);
        MessageResponse response = MessageResponse.builder()
                .id(saved.getId())
                .roomId(channel.getWorkspace() != null ? channel.getWorkspace().getId() : null)
                .channelId(channel.getId())
                .senderId(actor.getId())
                .senderName(actor.getDisplayName())
                .senderAvatar(actor.getAvatarUrl())
                .content(saved.getContent())
                .type(saved.getType())
                .isDeleted(false)
                .isPinned(false)
                .mentionedUserIds(saved.getMentionedUserIds())
                .reactions(Collections.emptyList())
                .sentAt(saved.getSentAt())
                .build();
        messagingTemplate.convertAndSend("/topic/channel/" + channel.getId(), response);
    }
}
