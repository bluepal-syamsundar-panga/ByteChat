package com.bytechat.serviceimpl;

import com.bytechat.dto.request.CreateWorkspaceRequest;
import com.bytechat.dto.response.WorkspaceResponse;
import com.bytechat.entity.*;
import com.bytechat.repository.*;
import com.bytechat.services.ChannelService;
import com.bytechat.services.NotificationService;
import com.bytechat.exception.UnauthorizedException;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
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
}
