package com.bytechat.controllers;

import com.bytechat.dto.response.ChannelResponse;
import com.bytechat.entity.Role;
import com.bytechat.entity.User;
import com.bytechat.services.ChannelService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.MOCK
)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class ChannelControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ChannelService channelService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .displayName("Test User")
                .role(Role.MEMBER)
                .build();
    }

    @Test
    void createChannel_Success() throws Exception {

        ChannelResponse response = ChannelResponse.builder()
                .id(1L)
                .name("general")
                .build();

        when(channelService.createChannel(
                anyLong(),
                anyString(),
                nullable(String.class), // ✅ FIX HERE
                anyBoolean(),
                anyBoolean(),
                any()
        )).thenReturn(response);

        mockMvc.perform(post("/api/channels/workspace/1")
                        .with(user(testUser))
                        .param("name", "general")
                        .param("isPrivate", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("general"));
    }

    @Test
    void getWorkspaceChannels_Success() throws Exception {

        when(channelService.getWorkspaceChannels(anyLong(), any()))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/channels/workspace/1")
                        .with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void archiveChannel_Success() throws Exception {

        doNothing().when(channelService).archiveChannel(anyLong(), any());

        mockMvc.perform(post("/api/channels/1/archive")
                        .with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void getChannelMembers_Success() throws Exception {

        when(channelService.getChannelMembers(anyLong()))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/channels/1/members")
                        .with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}