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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestWebSocketConfig.class)
class MeetingControllerIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MeetingService meetingService;

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
    void createMeeting_Success() throws Exception {
        CreateMeetingRequest request = new CreateMeetingRequest();
        request.setTitle("Scrum");
        request.setPassword("pass");

        MeetingResponse response = MeetingResponse.builder().id(100L).title("Scrum").build();
        when(meetingService.createMeeting(anyLong(), anyString(), anyString(), any(com.bytechat.entity.User.class))).thenReturn(response);

        mockMvc.perform(post("/api/meetings/channels/1")
                        .with(user(testUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void getActiveMeetings_Success() throws Exception {
        when(meetingService.getActiveWorkspaceMeetings(anyLong(), any(com.bytechat.entity.User.class))).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/meetings/workspaces/1").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void getMeeting_Success() throws Exception {
        MeetingResponse response = MeetingResponse.builder().id(100L).title("Scrum").build();
        when(meetingService.getMeeting(anyLong(), any(com.bytechat.entity.User.class))).thenReturn(response);

        mockMvc.perform(get("/api/meetings/100").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void joinMeeting_Success() throws Exception {
        JoinMeetingRequest request = new JoinMeetingRequest();
        request.setPassword("pass");

        MeetingResponse response = MeetingResponse.builder().id(100L).title("Scrum").build();
        when(meetingService.joinMeeting(anyLong(), anyString(), any(com.bytechat.entity.User.class))).thenReturn(response);

        mockMvc.perform(post("/api/meetings/100/join")
                        .with(user(testUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void endMeeting_Success() throws Exception {
        doNothing().when(meetingService).endMeeting(anyLong(), any(com.bytechat.entity.User.class));

        mockMvc.perform(post("/api/meetings/100/end").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
