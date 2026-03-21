import api from './api';

const chatService = {
  async getWorkspaces(page = 0, size = 50) {
    const response = await api.get(`/workspaces?page=${page}&size=${size}`);
    return response.data;
  },
  async createWorkspace(payload) { // Note: now handled primarily via workspaceService with OTP
    const response = await api.post('/workspaces/create', payload);
    return response.data;
  },
  async inviteToWorkspace(workspaceId, email) {
    const response = await api.post(`/workspaces/${workspaceId}/invite`, { email });
    return response.data;
  },
  async joinWorkspace(workspaceId) {
    const response = await api.post(`/workspaces/${workspaceId}/join`);
    return response.data;
  },
  async getWorkspaceMembers(workspaceId) {
    const response = await api.get(`/workspaces/${workspaceId}/members`);
    return response.data;
  },
  async getChannelMessages(channelId, options = {}) {
    const { cursorSentAt, cursorId, size = 50 } = options;
    const params = new URLSearchParams();
    params.set('size', String(size));
    if (cursorSentAt) params.set('cursorSentAt', cursorSentAt);
    if (cursorId !== undefined && cursorId !== null) params.set('cursorId', String(cursorId));
    const response = await api.get(`/messages/channel/${channelId}?${params.toString()}`);
    return response.data?.data ?? response.data;
  },
  async sendChannelMessage(channelId, payload) {
    const response = await api.post(`/messages/channel/${channelId}`, payload);
    return response.data;
  },
  async editMessage(messageId, content) {
    const response = await api.put(`/messages/${messageId}`, { content, type: 'TEXT' });
    return response.data;
  },
  async deleteMessage(messageId, scope = 'everyone') {
    const response = await api.delete(`/messages/${messageId}?scope=${encodeURIComponent(scope)}`);
    return response.data;
  },
  async pinMessage(messageId) {
    const response = await api.post(`/messages/${messageId}/pin`);
    return response.data;
  },
  async reactToMessage(messageId, emoji) {
    const response = await api.post(`/messages/${messageId}/reactions?emoji=${encodeURIComponent(emoji)}`);
    return response.data;
  },
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  async archiveChannel(channelId) {
    const response = await api.post(`/channels/${channelId}/archive`);
    return response.data;
  },
  async markAsRead(messageId) {
    const response = await api.post(`/messages/${messageId}/read`);
    return response.data;
  },
  async markChannelAsRead(channelId) {
    const response = await api.post(`/messages/channel/${channelId}/read`);
    return response.data;
  },
};

export default chatService;
