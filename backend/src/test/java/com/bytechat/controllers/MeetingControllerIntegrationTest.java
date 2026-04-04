package com.bytechat.controllers;

import com.bytechat.AbstractIntegrationTest;
import com.bytechat.config.TestWebSocketConfig;
import com.bytechat.dto.request.CreateMeetingRequest;
import com.bytechat.dto.request.JoinMeetingRequest;
import com.bytechat.dto.response.MeetingResponse;
import com.bytechat.entity.User;
import com.bytechat.services.MeetingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@Import(TestWebSocketConfig.class)
class MeetingControllerIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MeetingService meetingService;

    @Autowired
    private ObjectMapper objectMapper;

    private MeetingResponse meetingResponse;

    @BeforeEach
    void setUp() {
        meetingResponse = MeetingResponse.builder()
                .id(1L)
                .title("Team Sync")
                .isActive(true)
                .build();
    }

    @Test
    void createMeeting_Success() throws Exception {
        CreateMeetingRequest request = new CreateMeetingRequest();
        request.setTitle("Team Sync");
        request.setPassword("pass123");

        when(meetingService.createMeeting(anyLong(), anyString(), any(), any())).thenReturn(meetingResponse);

        mockMvc.perform(post("/api/meetings/channels/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Team Sync"));
    }

    @Test
    void getActiveMeetings_Success() throws Exception {
        when(meetingService.getActiveWorkspaceMeetings(anyLong(), any())).thenReturn(Collections.singletonList(meetingResponse));

        mockMvc.perform(get("/api/meetings/workspaces/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].title").value("Team Sync"));
    }

    @Test
    void getMeeting_Success() throws Exception {
        when(meetingService.getMeeting(anyLong(), any())).thenReturn(meetingResponse);

        mockMvc.perform(get("/api/meetings/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Team Sync"));
    }

    @Test
    void joinMeeting_Success() throws Exception {
        JoinMeetingRequest request = new JoinMeetingRequest();
        request.setPassword("pass123");

        when(meetingService.joinMeeting(anyLong(), anyString(), any())).thenReturn(meetingResponse);

        mockMvc.perform(post("/api/meetings/1/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void endMeeting_Success() throws Exception {
        mockMvc.perform(post("/api/meetings/1/end"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
