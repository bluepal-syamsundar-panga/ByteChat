import api from './api';

const meetingService = {
  createMeeting: (channelId, title, password) =>
    api.post(`/meetings/channels/${channelId}`, { title, password }),
  getWorkspaceMeetings: (workspaceId) => api.get(`/meetings/workspaces/${workspaceId}`),
  getMeeting: (meetingId) => api.get(`/meetings/${meetingId}`),
  joinMeeting: (meetingId, password) => api.post(`/meetings/${meetingId}/join`, { password }),
  endMeeting: (meetingId) => api.post(`/meetings/${meetingId}/end`),
};

export default meetingService;
