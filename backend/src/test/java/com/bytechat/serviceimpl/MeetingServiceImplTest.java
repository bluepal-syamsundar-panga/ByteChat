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
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
    }

    @Test
    void createMeeting_Fails_WhenMeetingAlreadyActive() {
        when(channelRepository.findById(anyLong())).thenReturn(Optional.of(channel));
        when(channelMemberRepository.existsByChannelIdAndUserId(anyLong(), anyLong())).thenReturn(true);
        when(meetingRepository.findFirstByChannelIdAndIsActiveTrueOrderByCreatedAtDesc(anyLong()))
                .thenReturn(Optional.of(new Meeting()));

        org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class, () -> 
            meetingService.createMeeting(20L, "Title", "pass", creator));
    }

    @Test
    void createMeeting_Fails_WhenNotChannelMember() {
        when(channelRepository.findById(anyLong())).thenReturn(Optional.of(channel));
        when(channelMemberRepository.existsByChannelIdAndUserId(anyLong(), anyLong())).thenReturn(false);

        org.junit.jupiter.api.Assertions.assertThrows(com.bytechat.exception.UnauthorizedException.class, () -> 
            meetingService.createMeeting(20L, "Title", "pass", creator));
    }

    @Test
    void getActiveWorkspaceMeetings_Success() {
        Meeting activeMeeting = Meeting.builder().id(1L).channel(channel).workspace(workspace).creator(creator).isActive(true).build();
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(10L, creator.getId())).thenReturn(true);
        when(meetingRepository.findByWorkspaceIdAndIsActiveTrueOrderByCreatedAtDesc(10L)).thenReturn(List.of(activeMeeting));
        when(channelMemberRepository.existsByChannelIdAndUserId(anyLong(), anyLong())).thenReturn(true);

        List<MeetingResponse> results = meetingService.getActiveWorkspaceMeetings(10L, creator);

        assertEquals(1, results.size());
    }

    @Test
    void getActiveWorkspaceMeetings_Fails_WhenNotWorkspaceMember() {
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(anyLong(), anyLong())).thenReturn(false);
        org.junit.jupiter.api.Assertions.assertThrows(com.bytechat.exception.UnauthorizedException.class, () -> 
            meetingService.getActiveWorkspaceMeetings(10L, creator));
    }

    @Test
    void joinMeeting_Success() {
        Meeting meeting = Meeting.builder().id(1L).channel(channel).workspace(workspace).creator(creator).isActive(true).passwordHash("encoded").build();
        when(meetingRepository.findById(1L)).thenReturn(Optional.of(meeting));
        when(channelMemberRepository.existsByChannelIdAndUserId(anyLong(), anyLong())).thenReturn(true);
        when(passwordEncoder.matches("pass", "encoded")).thenReturn(true);

        MeetingResponse result = meetingService.joinMeeting(1L, "pass", creator);

        assertNotNull(result);
    }

    @Test
    void joinMeeting_Fails_WhenWrongPassword() {
        Meeting meeting = Meeting.builder().id(1L).channel(channel).isActive(true).passwordHash("encoded").build();
        when(meetingRepository.findById(1L)).thenReturn(Optional.of(meeting));
        when(channelMemberRepository.existsByChannelIdAndUserId(anyLong(), anyLong())).thenReturn(true);
        when(passwordEncoder.matches("wrong", "encoded")).thenReturn(false);

        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () -> 
            meetingService.joinMeeting(1L, "wrong", creator));
    }

    @Test
    void joinMeeting_Fails_WhenMeetingEnded() {
        Meeting meeting = Meeting.builder().id(1L).isActive(false).build();
        when(meetingRepository.findById(1L)).thenReturn(Optional.of(meeting));

        org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class, () -> 
            meetingService.joinMeeting(1L, "pass", creator));
    }

    @Test
    void endMeeting_Success() {
        Meeting meeting = Meeting.builder().id(1L).channel(channel).creator(creator).isActive(true).build();
        when(meetingRepository.findById(1L)).thenReturn(Optional.of(meeting));
        when(channelMemberRepository.findByChannelId(anyLong())).thenReturn(Collections.emptyList());
        when(messageRepository.saveAndFlush(any())).thenAnswer(i -> i.getArgument(0));

        meetingService.endMeeting(1L, creator);

        assertFalse(meeting.isActive());
        verify(meetingRepository).save(meeting);
    }

    @Test
    void endMeeting_Fails_WhenNotCreator() {
        Meeting meeting = Meeting.builder().id(1L).creator(creator).isActive(true).build();
        User other = User.builder().id(99L).build();
        when(meetingRepository.findById(1L)).thenReturn(Optional.of(meeting));

        org.junit.jupiter.api.Assertions.assertThrows(com.bytechat.exception.UnauthorizedException.class, () -> 
            meetingService.endMeeting(1L, other));
    }
    
    @Test
    void getMeeting_Success() {
        Meeting meeting = Meeting.builder().id(1L).channel(channel).isActive(true).build();
        when(meetingRepository.findById(1L)).thenReturn(Optional.of(meeting));
        when(channelMemberRepository.existsByChannelIdAndUserId(anyLong(), anyLong())).thenReturn(true);

        MeetingResponse result = meetingService.getMeeting(1L, creator);
        assertNotNull(result);
    }
}
