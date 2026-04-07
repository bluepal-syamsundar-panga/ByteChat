package com.bytechat.serviceimpl;

import com.bytechat.dto.response.ChannelResponse;
import com.bytechat.entity.*;
import com.bytechat.repository.*;
import com.bytechat.services.NotificationService;
import com.bytechat.services.EmailService;
import com.bytechat.exception.ResourceNotFoundException;
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
    void createChannel_ThrowsException_WhenWorkspaceNotFound() {
        when(workspaceRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> 
            channelService.createChannel(1L, "new", "desc", false, false, user));
    }

    @Test
    void createChannel_Success_WhenCreatorIsNull() {
        when(workspaceRepository.findById(1L)).thenReturn(Optional.of(workspace));
        when(channelRepository.save(any(Channel.class))).thenReturn(channel);

        ChannelResponse response = channelService.createChannel(1L, "gen", "desc", false, true, null);

        assertNotNull(response);
        verify(channelMemberRepository, never()).save(any());
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
    void getWorkspaceChannels_ThrowsUnauthorized_WhenUserNull() {
        assertThrows(com.bytechat.exception.UnauthorizedException.class, () -> 
            channelService.getWorkspaceChannels(1L, null));
    }

    @Test
    void getWorkspaceChannels_ThrowsUnauthorized_WhenNotMember() {
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(anyLong(), anyLong())).thenReturn(false);
        assertThrows(com.bytechat.exception.UnauthorizedException.class, () -> 
            channelService.getWorkspaceChannels(1L, user));
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
    void addMember_Fails_WhenUserNotFound() {
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> channelService.addMember(1L, user));
    }

    @Test
    void addMember_Success_WhenUserNotInWorkspace() {
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(channelMemberRepository.existsByChannelIdAndUserId(1L, 1L)).thenReturn(false);
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(anyLong(), anyLong())).thenReturn(false);
        when(messageRepository.saveAndFlush(any(Message.class))).thenReturn(new Message());

        channelService.addMember(1L, user);

        verify(workspaceMemberRepository, times(1)).save(any(WorkspaceMember.class));
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
    }

    @Test
    void inviteUser_Fails_WhenAlreadyMember() {
        User invitee = User.builder().id(2L).email("invitee@example.com").build();
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(userRepository.findByEmail("invitee@example.com")).thenReturn(Optional.of(invitee));
        when(channelMemberRepository.existsByChannelIdAndUserId(1L, 2L)).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> 
            channelService.inviteUser(1L, "invitee@example.com", user));
    }

    @Test
    void getArchivedChannels_ReturnsList() {
        when(channelRepository.findArchivedChannels(anyLong(), anyLong()))
                .thenReturn(Arrays.asList(channel));

        List<ChannelResponse> responses = channelService.getArchivedChannels(1L, user);

        assertEquals(1, responses.size());
        verify(channelRepository).findArchivedChannels(1L, user.getId());
    }

    @Test
    void getDeletedChannels_ReturnsList() {
        when(channelRepository.findDeletedChannels(anyLong(), anyLong()))
                .thenReturn(Arrays.asList(channel));

        List<ChannelResponse> responses = channelService.getDeletedChannels(1L, user);

        assertEquals(1, responses.size());
        verify(channelRepository).findDeletedChannels(1L, user.getId());
    }

    @Test
    void getChannel_Success() {
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        Channel result = channelService.getChannel(1L);
        assertNotNull(result);
    }

    @Test
    void getChannel_Fails_WhenNotFound() {
        when(channelRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> channelService.getChannel(1L));
    }

    @Test
    void getChannelMembers_Success() {
        Channel randomChannel = Channel.builder()
                .id(1L)
                .name("random")
                .workspace(workspace)
                .createdBy(user)
                .build();
        ChannelMember membership = ChannelMember.builder()
                .user(user)
                .role(ChannelRole.ADMIN)
                .build();
        when(channelRepository.findById(1L)).thenReturn(Optional.of(randomChannel));
        when(channelMemberRepository.findByChannelId(1L)).thenReturn(Arrays.asList(membership));

        List<com.bytechat.dto.response.UserResponse> members = channelService.getChannelMembers(1L);

        assertEquals(1, members.size());
        assertEquals("ADMIN", members.get(0).getRole());
    }

    @Test
    void getChannelMembers_DefaultChannel_Syncs() {
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel)); // general is default
        channel.setDefault(true);
        when(workspaceMemberRepository.findByWorkspaceId(anyLong())).thenReturn(Arrays.asList(
            WorkspaceMember.builder().user(user).role(WorkspaceRole.MEMBER).build()
        ));
        when(channelMemberRepository.findByChannelIdAndUserId(anyLong(), anyLong())).thenReturn(Optional.empty());

        List<com.bytechat.dto.response.UserResponse> members = channelService.getChannelMembers(1L);

        assertNotNull(members);
        assertEquals(1, members.size());
    }

    @Test
    void acceptInvite_Success() {
        Notification notification = Notification.builder()
                .id(1L)
                .recipient(user)
                .type("CHANNEL_INVITE")
                .relatedEntityId(1L)
                .build();

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(channelMemberRepository.existsByChannelIdAndUserId(1L, 1L)).thenReturn(false);
        when(messageRepository.saveAndFlush(any(Message.class))).thenReturn(new Message());

        channelService.acceptInvite(1L, user);

        assertTrue(notification.isRead());
        verify(channelMemberRepository).save(any(ChannelMember.class));
    }

    @Test
    void acceptInvite_Fails_WhenAnotherUser() {
        User other = User.builder().id(99L).build();
        Notification notification = Notification.builder().id(1L).recipient(other).build();
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));

        assertThrows(com.bytechat.exception.UnauthorizedException.class, () -> 
            channelService.acceptInvite(1L, user));
    }

    @Test
    void acceptInvite_Fails_WhenWrongType() {
        Notification notification = Notification.builder().id(1L).recipient(user).type("OTHER").build();
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));

        assertThrows(RuntimeException.class, () -> channelService.acceptInvite(1L, user));
    }

    @Test
    void removeMember_Success() {
        User userToRemove = User.builder().id(2L).email("remove@example.com").build();
        ChannelMember membership = ChannelMember.builder().user(userToRemove).channel(channel).build();
        ChannelMember admin = ChannelMember.builder().user(user).role(ChannelRole.ADMIN).build();

        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(channelMemberRepository.findByChannelIdAndUserId(1L, user.getId())).thenReturn(Optional.of(admin));
        when(userRepository.findById(2L)).thenReturn(Optional.of(userToRemove));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(channelMemberRepository.findByChannelIdAndUserId(1L, 2L)).thenReturn(Optional.of(membership));
        when(messageRepository.saveAndFlush(any(Message.class))).thenReturn(new Message());

        channelService.removeMember(1L, 2L, user);

        verify(channelMemberRepository).delete(membership);
    }

    @Test
    void removeMember_DefaultChannel_RemovesFromWorkspace() {
        channel.setDefault(true);
        User userToRemove = User.builder().id(2L).email("remove@example.com").build();
        WorkspaceMember wsOwner = WorkspaceMember.builder().role(WorkspaceRole.OWNER).user(user).build();
        
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(anyLong(), eq(1L))).thenReturn(Optional.of(wsOwner));
        when(userRepository.findById(2L)).thenReturn(Optional.of(userToRemove));
        when(workspaceRepository.findById(anyLong())).thenReturn(Optional.of(workspace));
        workspace.setOwner(user);
        
        channelService.removeMember(1L, 2L, user);

        verify(workspaceMemberRepository).delete(any(WorkspaceMember.class));
    }

    @Test
    void restoreChannel_Success() {
        channel.setDeleted(true);
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(anyLong(), anyLong()))
                .thenReturn(Optional.of(WorkspaceMember.builder().role(WorkspaceRole.OWNER).build()));

        channelService.restoreChannel(1L, user);

        assertFalse(channel.isDeleted());
        verify(channelRepository).save(channel);
    }

    @Test
    void transferOwnership_Success() {
        ChannelMember currentAdmin = ChannelMember.builder().user(user).role(ChannelRole.ADMIN).build();
        User newAdminUser = User.builder().id(2L).displayName("NewAdmin").build();
        ChannelMember newAdmin = ChannelMember.builder().user(newAdminUser).role(ChannelRole.MEMBER).build();

        when(channelMemberRepository.findByChannelIdAndUserId(1L, 1L)).thenReturn(Optional.of(currentAdmin));
        when(channelMemberRepository.findByChannelIdAndUserId(1L, 2L)).thenReturn(Optional.of(newAdmin));
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(messageRepository.saveAndFlush(any(Message.class))).thenReturn(new Message());

        channelService.transferOwnership(1L, 2L, user);

        assertEquals(ChannelRole.MEMBER, currentAdmin.getRole());
        assertEquals(ChannelRole.ADMIN, newAdmin.getRole());
    }

    @Test
    void makeAdmin_Success() {
        ChannelMember actingMember = ChannelMember.builder().user(user).role(ChannelRole.ADMIN).build();
        User targetUser = User.builder().id(2L).displayName("target").build();
        ChannelMember targetMember = ChannelMember.builder().user(targetUser).role(ChannelRole.MEMBER).build();

        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(channelMemberRepository.findByChannelIdAndUserId(1L, 1L)).thenReturn(Optional.of(actingMember));
        when(channelMemberRepository.findByChannelIdAndUserId(1L, 2L)).thenReturn(Optional.of(targetMember));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(messageRepository.saveAndFlush(any(Message.class))).thenReturn(new Message());

        channelService.makeAdmin(1L, 2L, user);

        assertEquals(ChannelRole.ADMIN, targetMember.getRole());
    }

    @Test
    void archiveChannel_Success() {
        ChannelMember membership = ChannelMember.builder().user(user).isArchived(false).build();
        when(channelMemberRepository.findByChannelIdAndUserId(1L, 1L)).thenReturn(Optional.of(membership));

        channelService.archiveChannel(1L, user);

        assertTrue(membership.isArchived());
        verify(channelMemberRepository).save(membership);
    }

    @Test
    void leaveChannel_Success() {
        ChannelMember membership = ChannelMember.builder().user(user).role(ChannelRole.MEMBER).build();
        channel.setDefault(false);

        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(channelMemberRepository.findByChannelIdAndUserId(1L, 1L)).thenReturn(Optional.of(membership));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(messageRepository.saveAndFlush(any(Message.class))).thenReturn(new Message());

        channelService.leaveChannel(1L, user);

        verify(channelMemberRepository).delete(membership);
    }

    @Test
    void leaveChannel_Fails_WhenOnlyAdmin() {
        ChannelMember membership = ChannelMember.builder().user(user).role(ChannelRole.ADMIN).build();
        channel.setDefault(false);
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(channelMemberRepository.findByChannelIdAndUserId(1L, 1L)).thenReturn(Optional.of(membership));
        // Only 1 member, who is admin
        when(channelMemberRepository.findByChannelId(1L)).thenReturn(Arrays.asList(membership, ChannelMember.builder().build()));
        
        assertThrows(RuntimeException.class, () -> channelService.leaveChannel(1L, user));
    }

    @Test
    void leaveChannel_ThrowsException_WhenDefaultChannel() {
        channel.setDefault(true);
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));

        assertThrows(RuntimeException.class, () -> channelService.leaveChannel(1L, user));
    }

    @Test
    void deleteChannel_Success() {
        channel.setDefault(false);
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(anyLong(), anyLong()))
                .thenReturn(Optional.of(WorkspaceMember.builder().role(WorkspaceRole.OWNER).build()));

        channelService.deleteChannel(1L, user);

        assertTrue(channel.isDeleted());
        verify(channelRepository).save(channel);
    }

    @Test
    void deleteChannel_Fails_WhenDefault() {
        channel.setDefault(true);
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(anyLong(), anyLong()))
                .thenReturn(Optional.of(WorkspaceMember.builder().role(WorkspaceRole.OWNER).build()));

        assertThrows(RuntimeException.class, () -> channelService.deleteChannel(1L, user));
    }

    @Test
    void deleteChannel_ThrowsUnauthorized_WhenNotOwnerOrCreator() {
        User otherUser = User.builder().id(99L).build();
        channel.setCreatedBy(otherUser);
        channel.setDefault(false);
        
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(anyLong(), eq(1L)))
                .thenReturn(Optional.of(WorkspaceMember.builder().role(WorkspaceRole.MEMBER).build()));

        assertThrows(com.bytechat.exception.UnauthorizedException.class, () -> channelService.deleteChannel(1L, user));
    }

    @Test
    void permanentlyDeleteChannel_Success() {
        channel.setDeleted(true);
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(anyLong(), eq(1L)))
                .thenReturn(Optional.of(WorkspaceMember.builder().role(WorkspaceRole.OWNER).build()));

        channelService.permanentlyDeleteChannel(1L, user);

        verify(channelRepository).delete(channel);
    }

    @Test
    void permanentlyDeleteChannel_Fails_WhenNotDeleted() {
        channel.setDeleted(false);
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(anyLong(), eq(1L)))
                .thenReturn(Optional.of(WorkspaceMember.builder().role(WorkspaceRole.OWNER).build()));

        assertThrows(RuntimeException.class, () -> channelService.permanentlyDeleteChannel(1L, user));
    }

    @Test
    void removeAdmin_Success() {
        ChannelMember admin = ChannelMember.builder().user(user).role(ChannelRole.ADMIN).build();
        User targetUser = User.builder().id(2L).displayName("target").build();
        ChannelMember targetMember = ChannelMember.builder().user(targetUser).role(ChannelRole.ADMIN).build();
        
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(channelMemberRepository.findByChannelIdAndUserId(1L, 1L)).thenReturn(Optional.of(admin));
        when(channelMemberRepository.findByChannelIdAndUserId(1L, 2L)).thenReturn(Optional.of(targetMember));
        when(channelMemberRepository.findByChannelId(1L)).thenReturn(java.util.Arrays.asList(admin, targetMember));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(messageRepository.saveAndFlush(any(Message.class))).thenReturn(new Message());

        channelService.removeAdmin(1L, 2L, user);

        assertEquals(ChannelRole.MEMBER, targetMember.getRole());
    }

    @Test
    void removeAdmin_ThrowsException_WhenLastAdmin() {
        ChannelMember admin = ChannelMember.builder().user(user).role(ChannelRole.ADMIN).build();
        User targetUser = User.builder().id(2L).build();
        ChannelMember targetMember = ChannelMember.builder().user(targetUser).role(ChannelRole.ADMIN).build();

        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(channelMemberRepository.findByChannelIdAndUserId(1L, 1L)).thenReturn(Optional.of(admin));
        when(channelMemberRepository.findByChannelIdAndUserId(1L, 2L)).thenReturn(Optional.of(targetMember));
        when(channelMemberRepository.findByChannelId(1L)).thenReturn(java.util.Arrays.asList(targetMember));

        assertThrows(RuntimeException.class, () -> channelService.removeAdmin(1L, 2L, user));
    }

    @Test
    void syncDefaultChannelMemberships_Success() {
        User memberUser = User.builder().id(2L).email("member@example.com").build();
        WorkspaceMember wsMember = WorkspaceMember.builder().user(memberUser).role(WorkspaceRole.MEMBER).build();
        
        channel.setDefault(true);
        when(workspaceMemberRepository.findByWorkspaceId(anyLong())).thenReturn(java.util.Arrays.asList(wsMember));
        when(channelMemberRepository.existsByChannelIdAndUserId(anyLong(), eq(2L))).thenReturn(false);
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        
        channelService.getChannelMembers(1L);

        verify(channelMemberRepository).save(any(ChannelMember.class));
    }
}
