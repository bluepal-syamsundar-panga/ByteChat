package com.bytechat.serviceimpl;

import com.bytechat.dto.response.MeetingResponse;
import com.bytechat.entity.Channel;
import com.bytechat.entity.ChannelMember;
import com.bytechat.entity.Meeting;
import com.bytechat.entity.User;
import com.bytechat.entity.Workspace;
import com.bytechat.repository.ChannelMemberRepository;
import com.bytechat.repository.ChannelRepository;
import com.bytechat.repository.MeetingRepository;
import com.bytechat.repository.MessageRepository;
import com.bytechat.repository.WorkspaceMemberRepository;
import com.bytechat.services.EmailService;
import com.bytechat.services.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MeetingServiceImplTest {

    @Mock
    private MeetingRepository meetingRepository;
    @Mock
    private ChannelRepository channelRepository;
    @Mock
    private ChannelMemberRepository channelMemberRepository;
    @Mock
    private WorkspaceMemberRepository workspaceMemberRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private EmailService emailService;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private MessageRepository messageRepository;
    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private MeetingServiceImpl meetingService;

    private User creator;
    private User member;
    private Channel channel;
    private Workspace workspace;

    @BeforeEach
    void setUp() {
        creator = User.builder().id(1L).email("creator@example.com").displayName("Creator").build();
        member = User.builder().id(2L).email("member@example.com").displayName("Member").build();
        workspace = Workspace.builder().id(10L).name("Engineering").build();
        channel = Channel.builder().id(20L).name("general").workspace(workspace).createdBy(creator).build();
    }

    @Test
    void createMeeting_SendsNotificationsAndEmailsToChannelMembers() {
        Meeting savedMeeting = Meeting.builder()
                .id(99L)
                .channel(channel)
                .workspace(workspace)
                .creator(creator)
                .title("Daily Sync")
                .passwordHash("encoded")
                .roomKey("room-123")
                .build();

        when(channelRepository.findById(channel.getId())).thenReturn(Optional.of(channel));
        when(channelMemberRepository.existsByChannelIdAndUserId(channel.getId(), creator.getId())).thenReturn(true);
        when(meetingRepository.findFirstByChannelIdAndIsActiveTrueOrderByCreatedAtDesc(channel.getId())).thenReturn(Optional.empty());
        when(passwordEncoder.encode("secret")).thenReturn("encoded");
        when(meetingRepository.save(any(Meeting.class))).thenReturn(savedMeeting);
        when(channelMemberRepository.findByChannelId(channel.getId())).thenReturn(List.of(
                ChannelMember.builder().channel(channel).user(creator).build(),
                ChannelMember.builder().channel(channel).user(member).build()
        ));
        when(messageRepository.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));

        MeetingResponse response = meetingService.createMeeting(channel.getId(), "Daily Sync", "secret", creator);

        assertNotNull(response);
        assertEquals(savedMeeting.getId(), response.getId());
        verify(notificationService, times(1))
                .sendNotification(eq(member.getId()), eq("MEETING_INVITE"), any(), eq(savedMeeting.getId()));
        verify(notificationService, never())
                .sendNotification(eq(creator.getId()), eq("MEETING_INVITE"), any(), anyLong());
        verify(emailService, times(1))
                .sendMeetingInvite(eq(member.getEmail()), eq(creator.getDisplayName()), eq("Daily Sync"), eq("general"), eq("Engineering"));
        verify(emailService, never())
                .sendMeetingInvite(eq(creator.getEmail()), any(), any(), any(), any());
    }
}
