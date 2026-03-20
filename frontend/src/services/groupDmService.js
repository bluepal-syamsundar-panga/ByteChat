import api from './api';

const groupDmService = {
  async getGroups() {
    const response = await api.get('/group-dm');
    return response.data;
  },
  async getGroup(groupId) {
    const response = await api.get(`/group-dm/${groupId}`);
    return response.data;
  },
  async createGroup(workspaceId, name, memberIds) {
    const response = await api.post('/group-dm', { workspaceId, name, memberIds });
    return response.data;
  },
  async getPendingInvites() {
    const response = await api.get('/group-dm/invites');
    return response.data;
  },
  async acceptInvite(inviteId) {
    const response = await api.post(`/group-dm/invites/${inviteId}/accept`);
    return response.data;
  },
  async rejectInvite(inviteId) {
    const response = await api.post(`/group-dm/invites/${inviteId}/reject`);
    return response.data;
  },
  async inviteMembers(groupId, memberIds) {
    const response = await api.post(`/group-dm/${groupId}/invite`, { memberIds });
    return response.data;
  },
  async leaveGroup(groupId) {
    const response = await api.post(`/group-dm/${groupId}/leave`);
    return response.data;
  },
  async deleteGroup(groupId) {
    const response = await api.delete(`/group-dm/${groupId}`);
    return response.data;
  },
  async removeMember(groupId, userId) {
    const response = await api.delete(`/group-dm/${groupId}/members/${userId}`);
    return response.data;
  },
  async getMessages(groupId, page = 0, size = 50) {
    const response = await api.get(`/group-dm/${groupId}/messages?page=${page}&size=${size}`);
    return response.data;
  },
  async sendMessage(groupId, content) {
    const payload = typeof content === 'string' ? { content, type: 'TEXT' } : content;
    const response = await api.post(`/group-dm/${groupId}/messages`, payload);
    return response.data;
  },
  async editMessage(messageId, content) {
    const response = await api.put(`/group-dm/messages/${messageId}`, { content });
    return response.data;
  },
  async deleteMessage(messageId, scope = 'everyone') {
    const response = await api.delete(`/group-dm/messages/${messageId}?scope=${encodeURIComponent(scope)}`);
    return response.data;
  },
  async pinMessage(messageId) {
    const response = await api.post(`/group-dm/messages/${messageId}/pin`);
    return response.data;
  },
  async reactToMessage(messageId, emoji) {
    const response = await api.post(`/group-dm/messages/${messageId}/react?emoji=${encodeURIComponent(emoji)}`);
    return response.data;
  },
  async markAsRead(groupId) {
    const response = await api.post(`/group-dm/${groupId}/read`);
    return response.data;
  },
};

export default groupDmService;
