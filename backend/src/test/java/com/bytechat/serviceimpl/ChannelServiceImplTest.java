package com.bytechat.serviceimpl;

import com.bytechat.dto.response.ChannelResponse;
import com.bytechat.entity.*;
import com.bytechat.repository.*;
import com.bytechat.services.NotificationService;
import com.bytechat.services.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChannelServiceImplTest {

    @Mock
    private ChannelRepository channelRepository;
    @Mock
    private WorkspaceRepository workspaceRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private WorkspaceMemberRepository workspaceMemberRepository;
    @Mock
    private MessageRepository messageRepository;
    @Mock
    private ChannelMemberRepository channelMemberRepository;
    @Mock
    private EmailService emailService;
    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private ChannelServiceImpl channelService;

    private User user;
    private Workspace workspace;
    private Channel channel;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).email("user@example.com").build();
        workspace = Workspace.builder().id(1L).name("Workspace").build();
        channel = Channel.builder()
                .id(1L)
                .name("general")
                .workspace(workspace)
                .createdBy(user)
                .build();
    }

    @Test
    void createChannel_Success() {
        when(workspaceRepository.findById(1L)).thenReturn(Optional.of(workspace));
        when(channelRepository.save(any(Channel.class))).thenReturn(channel);
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(user));

        ChannelResponse response = channelService.createChannel(1L, "general", "Desc", false, true, user);

        assertNotNull(response);
        assertEquals("general", response.getName());
        verify(channelRepository, times(1)).save(any(Channel.class));
        verify(channelMemberRepository, times(1)).save(any(ChannelMember.class));
    }

    @Test
    void getWorkspaceChannels_ReturnsList() {
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(anyLong(), anyLong()))
                .thenReturn(true);
        when(channelRepository.findVisibleChannels(anyLong(), anyLong()))
                .thenReturn(Arrays.asList(channel));

        List<ChannelResponse> responses = channelService.getWorkspaceChannels(1L, user);

        assertEquals(1, responses.size());
        verify(channelRepository, times(1))
                .findVisibleChannels(1L, user.getId());
    }

    @Test
    void addMember_Success() {
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(channelMemberRepository.existsByChannelIdAndUserId(1L, 1L)).thenReturn(false);
        when(messageRepository.saveAndFlush(any(Message.class))).thenAnswer(invocation -> {
            Message message = invocation.getArgument(0);
            message.setId(1L);
            return message;
        });

        channelService.addMember(1L, user);

        verify(channelMemberRepository, times(1)).save(any(ChannelMember.class));
    }

    @Test
    void inviteUser_Success() {
        User invitee = User.builder().id(2L).email("invitee@example.com").build();

        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(userRepository.findByEmail("invitee@example.com")).thenReturn(Optional.of(invitee));
        when(channelMemberRepository.existsByChannelIdAndUserId(1L, 2L)).thenReturn(false);

        channelService.inviteUser(1L, "invitee@example.com", user);

        verify(notificationService, times(1))
                .sendNotification(eq(2L), eq("CHANNEL_INVITE"), anyString(), eq(1L));

        // ✅ FIXED ASSERTION
        verify(emailService, times(1)).sendInvitation(
                eq("invitee@example.com"),
                isNull(), // 👈 important fix
                eq("general"),
                eq("Workspace"),
                eq("CHANNEL")
        );
    }

    @Test
    void archiveChannel_Success() {
        ChannelMember membership = ChannelMember.builder()
                .user(user)
                .channel(channel)
                .build();

        when(channelMemberRepository.findByChannelIdAndUserId(1L, 1L))
                .thenReturn(Optional.of(membership));

        channelService.archiveChannel(1L, user);

        assertTrue(membership.isArchived());
        verify(channelMemberRepository, times(1)).save(membership);
    }

    @Test
    void leaveChannel_DefaultChannel_ThrowsException() {
        channel.setDefault(true);
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));

        assertThrows(RuntimeException.class,
                () -> channelService.leaveChannel(1L, user));
    }

    @Test
    void deleteChannel_Success() {
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(anyLong(), anyLong()))
                .thenReturn(Optional.of(
                        WorkspaceMember.builder()
                                .role(WorkspaceRole.OWNER)
                                .build()
                ));

        channelService.deleteChannel(1L, user);

        assertTrue(channel.isDeleted());
        verify(channelRepository, times(1)).save(channel);
    }
}
