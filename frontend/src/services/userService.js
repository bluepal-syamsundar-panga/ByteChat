import api from './api';

const userService = {
  async getUsers() {
    const response = await api.get('/users');
    return response.data;
  },
  async getOnlineUsers() {
    const response = await api.get('/users/online');
    return response.data;
  },
  async getCurrentUser() {
    const response = await api.get('/users/me');
    return response.data;
  },
  async updateCurrentUser(payload) {
    const response = await api.put('/users/me', payload);
    return response.data;
  },
  async updateAvatar(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  async getSharedRoomUsers() {
    const response = await api.get('/users/shared');
    return response.data;
  },
};

export default userService;
