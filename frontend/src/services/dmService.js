import api from './api';

const dmService = {
  async getDirectMessages(userId, page = 0, size = 50) {
    const response = await api.get(`/dm/${userId}?page=${page}&size=${size}`);
    return response.data;
  },
  async sendDirectMessage(userId, content) {
    const payload = typeof content === 'string' ? { content, type: 'TEXT' } : content;
    const response = await api.post(`/dm/${userId}`, payload);
    return response.data;
  },
  async markAsRead(userId) {
    const response = await api.post(`/dm/${userId}/read`);
    return response.data;
  },
  async editMessage(dmId, content) {
    const response = await api.put(`/dm/${dmId}`, { content });
    return response.data;
  },
  async deleteMessage(dmId, scope = 'everyone') {
    const response = await api.delete(`/dm/${dmId}?scope=${encodeURIComponent(scope)}`);
    return response.data;
  },
  async pinMessage(dmId) {
    const response = await api.post(`/dm/${dmId}/pin`);
    return response.data;
  },
  async reactToMessage(dmId, emoji) {
    const response = await api.post(`/dm/${dmId}/react?emoji=${encodeURIComponent(emoji)}`);
    return response.data;
  },
};

export default dmService;
