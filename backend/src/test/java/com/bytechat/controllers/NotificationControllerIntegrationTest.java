package com.bytechat.controllers;

import com.bytechat.AbstractIntegrationTest;
import com.bytechat.config.TestWebSocketConfig;
import com.bytechat.entity.Notification;
import com.bytechat.entity.User;
import com.bytechat.services.ChannelService;
import com.bytechat.services.NotificationService;
import com.bytechat.services.WorkspaceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestWebSocketConfig.class)
class NotificationControllerIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NotificationService notificationService;

    @MockBean
    private WorkspaceService workspaceService;

    @MockBean
    private ChannelService channelService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .displayName("Test User")
                .role(com.bytechat.entity.Role.MEMBER)
                .build();
    }

    @Test
    void getNotifications_Success() throws Exception {
        when(notificationService.getUserNotifications(anyLong())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/notifications").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void markAsRead_Success() throws Exception {
        doNothing().when(notificationService).markAsRead(anyLong());

        mockMvc.perform(put("/api/notifications/1/read").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void markWorkspaceRead_Success() throws Exception {
        doNothing().when(notificationService).markWorkspaceNotificationsAsRead(anyLong(), anyLong());

        mockMvc.perform(put("/api/notifications/mark-workspace-read/1").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void markRoomRead_Success() throws Exception {
        doNothing().when(notificationService).markChannelNotificationsAsRead(anyLong(), anyLong());

        mockMvc.perform(put("/api/notifications/mark-room-read/1").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void markDMRead_Success() throws Exception {
        doNothing().when(notificationService).markDMNotificationsAsRead(anyLong(), anyLong());

        mockMvc.perform(put("/api/notifications/mark-dm-read/2").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void acceptNotification_ChannelInvite_Success() throws Exception {
        Notification notification = Notification.builder().type("CHANNEL_INVITE").build();
        when(notificationService.getNotification(1L)).thenReturn(notification);
        doNothing().when(channelService).acceptInvite(anyLong(), any(com.bytechat.entity.User.class));

        mockMvc.perform(post("/api/notifications/1/accept").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void acceptNotification_WorkspaceInvite_Success() throws Exception {
        Notification notification = Notification.builder().type("WORKSPACE_INVITE").build();
        when(notificationService.getNotification(1L)).thenReturn(notification);
        doNothing().when(workspaceService).acceptInvite(anyLong(), any(com.bytechat.entity.User.class));

        mockMvc.perform(post("/api/notifications/1/accept").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
