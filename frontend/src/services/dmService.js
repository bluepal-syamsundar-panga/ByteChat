import api from './api';

const dmService = {
  async getDirectMessages(userId, page = 0, size = 50) {
    const response = await api.get(`/dm/${userId}?page=${page}&size=${size}`);
    return response.data;
  },
  async sendDirectMessage(userId, content) {
    const response = await api.post(`/dm/${userId}`, { content, type: 'TEXT' });
    return response.data;
  },
  async markAsRead(userId) {
    const response = await api.post(`/dm/${userId}/read`);
    return response.data;
  },
};

export default dmService;
