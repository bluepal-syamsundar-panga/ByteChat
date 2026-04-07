package com.bytechat.serviceimpl;

import com.bytechat.dto.request.CreateWorkspaceRequest;
import com.bytechat.dto.response.WorkspaceResponse;
import com.bytechat.entity.*;
import com.bytechat.repository.*;
import com.bytechat.services.ChannelService;
import com.bytechat.services.NotificationService;
import com.bytechat.exception.ConflictException;
import com.bytechat.exception.UnauthorizedException;
import com.bytechat.config.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkspaceServiceImplTest {

    @Mock
    private WorkspaceRepository workspaceRepository;
    @Mock
    private WorkspaceMemberRepository workspaceMemberRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ChannelService channelService;
    @Mock
    private ChannelRepository channelRepository;
    @Mock
    private ChannelMemberRepository channelMemberRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private com.bytechat.services.EmailService emailService;
    @Mock
    private JwtService jwtService;

    @InjectMocks
    private WorkspaceServiceImpl workspaceService;

    private User owner;
    private Workspace workspace;
    private CreateWorkspaceRequest createRequest;

    @BeforeEach
    void setUp() {
        owner = User.builder().id(1L).email("owner@example.com").displayName("Owner").build();
        workspace = Workspace.builder().id(1L).name("Test Workspace").owner(owner).build();
        createRequest = new CreateWorkspaceRequest();
        createRequest.setName("Test Workspace");
    }

    @Test
    void createWorkspace_Success() {
        when(workspaceRepository.save(any(Workspace.class))).thenReturn(workspace);
        
        WorkspaceResponse response = workspaceService.createWorkspace(createRequest, owner);

        assertNotNull(response);
        assertEquals("Test Workspace", response.getName());
        verify(workspaceRepository, times(1)).save(any(Workspace.class));
        verify(workspaceMemberRepository, times(1)).save(any(WorkspaceMember.class));
        verify(channelService, times(1)).createChannel(anyLong(), anyString(), anyString(), anyBoolean(), anyBoolean(), any(User.class));
    }

    @Test
    void createWorkspaceWithDetails_Success_ExistingUser() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(owner));
        when(workspaceRepository.save(any(Workspace.class))).thenReturn(workspace);
        when(jwtService.generateToken(any())).thenReturn("token");

        com.bytechat.dto.response.WorkspaceCreationResponse response = 
            workspaceService.createWorkspaceWithDetails(createRequest, "owner@example.com", owner);

        assertNotNull(response);
        verify(userRepository, never()).save(any());
    }

    @Test
    void createWorkspaceWithDetails_Success_NewUser() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(owner);
        when(workspaceRepository.save(any(Workspace.class))).thenReturn(workspace);
        when(jwtService.generateToken(any())).thenReturn("token");

        com.bytechat.dto.response.WorkspaceCreationResponse response = 
            workspaceService.createWorkspaceWithDetails(createRequest, "new@example.com", null);

        assertNotNull(response);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void getUserWorkspaces_ReturnsPage() {
        Page<Workspace> workspacePage = new PageImpl<>(Collections.singletonList(workspace));
        when(workspaceRepository.findJoinedWorkspaces(anyLong(), any(PageRequest.class))).thenReturn(workspacePage);

        Page<WorkspaceResponse> responses = workspaceService.getUserWorkspaces(owner, 0, 10);

        assertEquals(1, responses.getContent().size());
        verify(workspaceRepository, times(1)).findJoinedWorkspaces(anyLong(), any(PageRequest.class));
    }

    @Test
    void joinWorkspace_Success() {
        when(workspaceRepository.findById(1L)).thenReturn(Optional.of(workspace));
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(1L, owner.getId())).thenReturn(false);

        workspaceService.joinWorkspace(1L, owner);

        verify(workspaceMemberRepository, times(1)).save(any(WorkspaceMember.class));
    }

    @Test
    void joinWorkspace_Fails_WhenPrivateNotOwner() {
        workspace.setPrivate(true);
        User outsider = User.builder().id(99L).build();
        when(workspaceRepository.findById(1L)).thenReturn(Optional.of(workspace));

        assertThrows(RuntimeException.class, () -> workspaceService.joinWorkspace(1L, outsider));
    }

    @Test
    void joinWorkspace_Archived_ThrowsException() {
        workspace.setArchived(true);
        when(workspaceRepository.findById(1L)).thenReturn(Optional.of(workspace));

        assertThrows(RuntimeException.class, () -> workspaceService.joinWorkspace(1L, owner));
    }

    @Test
    void leaveWorkspace_Owner_ThrowsException() {
        WorkspaceMember member = WorkspaceMember.builder()
                .workspace(workspace)
                .user(owner)
                .role(WorkspaceRole.OWNER)
                .build();
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(1L, owner.getId())).thenReturn(Optional.of(member));

        assertThrows(RuntimeException.class, () -> workspaceService.leaveWorkspace(1L, owner));
    }

    @Test
    void archiveWorkspace_Success() {
        when(workspaceRepository.findById(1L)).thenReturn(Optional.of(workspace));
        
        workspaceService.archiveWorkspace(1L, owner);

        assertTrue(workspace.isArchived());
        verify(workspaceRepository, times(1)).save(workspace);
    }

    @Test
    void archiveWorkspace_NotOwner_ThrowsException() {
        User otherUser = User.builder().id(2L).build();
        when(workspaceRepository.findById(1L)).thenReturn(Optional.of(workspace));

        assertThrows(UnauthorizedException.class, () -> workspaceService.archiveWorkspace(1L, otherUser));
    }

    @Test
    void deleteWorkspace_Success() {
        when(workspaceRepository.findById(1L)).thenReturn(Optional.of(workspace));

        workspaceService.deleteWorkspace(1L, owner);

        verify(workspaceRepository).delete(workspace);
    }

    @Test
    void deleteWorkspace_NotOwner_ThrowsException() {
        User otherUser = User.builder().id(2L).email("other@example.com").build();
        when(workspaceRepository.findById(1L)).thenReturn(Optional.of(workspace));

        assertThrows(UnauthorizedException.class, () -> workspaceService.deleteWorkspace(1L, otherUser));
        verify(workspaceRepository, never()).delete(any(Workspace.class));
    }

    @Test
    void inviteUser_Success() {
        User invitedUser = User.builder().id(2L).email("new@example.com").build();
        when(workspaceRepository.findById(1L)).thenReturn(Optional.of(workspace));
        when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.of(invitedUser));
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(1L, 2L)).thenReturn(false);
        when(notificationRepository.findByRecipientIdAndTypeAndRelatedEntityIdAndIsReadFalse(2L, "WORKSPACE_INVITE", 1L))
                .thenReturn(Collections.emptyList());

        workspaceService.inviteUser(1L, "new@example.com", owner);

        verify(notificationService).sendNotification(eq(2L), eq("WORKSPACE_INVITE"), anyString(), eq(1L));
        verify(emailService).sendInvitation(eq("new@example.com"), anyString(), anyString(), anyString(), eq("WORKSPACE"));
    }

    @Test
    void acceptInvite_Success() {
        Notification notification = Notification.builder()
                .id(1L)
                .recipient(owner)
                .type("WORKSPACE_INVITE")
                .relatedEntityId(1L)
                .build();
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));
        when(workspaceRepository.findById(1L)).thenReturn(Optional.of(workspace));
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(1L, owner.getId())).thenReturn(false);

        workspaceService.acceptInvite(1L, owner);

        assertTrue(notification.isRead());
        verify(workspaceMemberRepository).save(any(WorkspaceMember.class));
    }

    @Test
    void removeMember_Success() {
        User memberToRemove = User.builder().id(2L).email("remove@example.com").build();
        when(workspaceRepository.findById(1L)).thenReturn(Optional.of(workspace));
        when(userRepository.findById(2L)).thenReturn(Optional.of(memberToRemove));
        when(channelMemberRepository.findByWorkspaceIdAndUserId(1L, 2L)).thenReturn(Collections.emptyList());
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(1L, 2L)).thenReturn(Optional.of(WorkspaceMember.builder().build()));

        workspaceService.removeMember(1L, 2L, owner);

        verify(workspaceMemberRepository).delete(any(WorkspaceMember.class));
    }

    @Test
    void getWorkspaceMembers_Success() {
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(1L, 1L)).thenReturn(true);
        when(workspaceMemberRepository.findByWorkspaceId(1L)).thenReturn(Collections.singletonList(
                WorkspaceMember.builder().user(owner).role(WorkspaceRole.OWNER).build()
        ));

        List<com.bytechat.dto.response.UserResponse> members = workspaceService.getWorkspaceMembers(1L, owner);

        assertEquals(1, members.size());
    }

    @Test
    void leaveWorkspace_Success() {
        User memberUser = User.builder().id(2L).email("member@example.com").build();
        WorkspaceMember member = WorkspaceMember.builder()
                .workspace(workspace)
                .user(memberUser)
                .role(WorkspaceRole.MEMBER)
                .build();
        
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(1L, 2L)).thenReturn(Optional.of(member));
        when(workspaceRepository.findById(1L)).thenReturn(Optional.of(workspace));
        when(channelMemberRepository.findByWorkspaceIdAndUserId(1L, 2L)).thenReturn(Collections.emptyList());

        workspaceService.leaveWorkspace(1L, memberUser);

        verify(workspaceMemberRepository).delete(member);
    }

    @Test
    void leaveWorkspace_AdminTransfer_Success() {
        User adminUser = User.builder().id(2L).email("admin@example.com").build();
        WorkspaceMember wsMember = WorkspaceMember.builder().user(adminUser).role(WorkspaceRole.MEMBER).build();
        Channel channel1 = Channel.builder().id(1L).name("C1").build();
        ChannelMember adminCm = ChannelMember.builder().channel(channel1).user(adminUser).role(ChannelRole.ADMIN).build();
        
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(1L, 2L)).thenReturn(Optional.of(wsMember));
        when(workspaceRepository.findById(1L)).thenReturn(Optional.of(workspace));
        when(channelMemberRepository.findByWorkspaceIdAndUserId(1L, 2L)).thenReturn(Collections.singletonList(adminCm));
        when(channelMemberRepository.findByChannelId(1L)).thenReturn(Collections.singletonList(adminCm));
        when(channelMemberRepository.existsByChannelIdAndUserId(1L, 1L)).thenReturn(false); // owner 1L not in channel
        
        workspaceService.leaveWorkspace(1L, adminUser);

        verify(channelMemberRepository).save(any(ChannelMember.class)); // Transferred to owner
    }

    @Test
    void leaveWorkspace_ThrowsException_WhenNotMember() {
        User outsider = User.builder().id(99L).build();
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(1L, 99L)).thenReturn(Optional.empty());

        assertThrows(com.bytechat.exception.ResourceNotFoundException.class, () -> workspaceService.leaveWorkspace(1L, outsider));
    }

    @Test
    void removeMember_ThrowsUnauthorized_WhenNotOwner() {
        User otherUser = User.builder().id(2L).build();
        when(workspaceRepository.findById(1L)).thenReturn(Optional.of(workspace));

        assertThrows(UnauthorizedException.class, () -> workspaceService.removeMember(1L, 3L, otherUser));
    }

    @Test
    void removeMember_ThrowsException_WhenRemovingSelf() {
        when(workspaceRepository.findById(1L)).thenReturn(Optional.of(workspace));

        assertThrows(RuntimeException.class, () -> workspaceService.removeMember(1L, owner.getId(), owner));
    }

    @Test
    void inviteUser_ThrowsConflict_WhenAlreadyMember() {
        User alreadyMember = User.builder().id(2L).email("member@example.com").build();
        when(workspaceRepository.findById(1L)).thenReturn(Optional.of(workspace));
        when(userRepository.findByEmail("member@example.com")).thenReturn(Optional.of(alreadyMember));
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(1L, 2L)).thenReturn(true);

        assertThrows(ConflictException.class, () -> workspaceService.inviteUser(1L, "member@example.com", owner));
    }

    @Test
    void inviteUser_ThrowsConflict_WhenDuplicateInvite() {
        User invitedUser = User.builder().id(2L).email("new@example.com").build();
        when(workspaceRepository.findById(1L)).thenReturn(Optional.of(workspace));
        when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.of(invitedUser));
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(1L, 2L)).thenReturn(false);
        when(notificationRepository.findByRecipientIdAndTypeAndRelatedEntityIdAndIsReadFalse(2L, "WORKSPACE_INVITE", 1L))
                .thenReturn(Collections.singletonList(new Notification()));

        assertThrows(ConflictException.class, () -> workspaceService.inviteUser(1L, "new@example.com", owner));
    }

    @Test
    void acceptInvite_ThrowsUnauthorized_WhenWrongRecipient() {
        User wrongUser = User.builder().id(99L).build();
        Notification notification = Notification.builder()
                .id(1L)
                .recipient(owner) // Belongs to owner
                .build();
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));

        assertThrows(UnauthorizedException.class, () -> workspaceService.acceptInvite(1L, wrongUser));
    }

    @Test
    void acceptInvite_ThrowsException_WhenWrongType() {
        Notification notification = Notification.builder()
                .id(1L)
                .recipient(owner)
                .type("OTHER_TYPE")
                .build();
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));

        assertThrows(RuntimeException.class, () -> workspaceService.acceptInvite(1L, owner));
    }

    @Test
    void getWorkspaceMembers_ThrowsException_WhenNotMember() {
        User outsider = User.builder().id(99L).build();
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(1L, 99L)).thenReturn(false);

        assertThrows(RuntimeException.class, () -> workspaceService.getWorkspaceMembers(1L, outsider));
    }
}
