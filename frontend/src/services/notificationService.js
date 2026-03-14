import api from './api';

const notificationService = {
  async getNotifications() {
    const response = await api.get('/notifications');
    return response.data;
  },
  async markAsRead(notificationId) {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },
  async accept(notificationId) {
    const response = await api.post(`/notifications/${notificationId}/accept`);
    return response.data;
  },
};

export default notificationService;
