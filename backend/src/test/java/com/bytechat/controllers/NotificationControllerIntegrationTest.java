package com.bytechat.controllers;

import com.bytechat.entity.Notification;
import com.bytechat.entity.User;
import com.bytechat.services.ChannelService;
import com.bytechat.services.NotificationService;
import com.bytechat.services.WorkspaceService;
import com.bytechat.config.TestWebSocketConfig;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Import;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.junit.jupiter.api.BeforeEach;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.bytechat.AbstractIntegrationTest;

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
        mockMvc.perform(put("/api/notifications/1/read").with(user(testUser)))
                .andExpect(status().isOk());
        
        verify(notificationService).markAsRead(1L);
    }

    @Test
    void acceptInvite_Success() throws Exception {
        Notification notification = Notification.builder().id(1L).type("WORKSPACE_INVITE").build();
        when(notificationService.getNotification(1L)).thenReturn(notification);

        mockMvc.perform(post("/api/notifications/1/accept").with(user(testUser)))
                .andExpect(status().isOk());
        
        verify(workspaceService).acceptInvite(eq(1L), any());
    }
}
