import api from './api';

const chatService = {
  async getRooms(page = 0, size = 50) {
    const response = await api.get(`/rooms?page=${page}&size=${size}`);
    return response.data;
  },
  async createRoom(payload) {
    const response = await api.post('/rooms', payload);
    return response.data;
  },
  async inviteUser(roomId, email) {
    const response = await api.post(`/rooms/${roomId}/invite`, { email });
    return response.data;
  },
  async joinRoom(roomId) {
    const response = await api.post(`/rooms/${roomId}/join`);
    return response.data;
  },
  async leaveRoom(roomId) {
    const response = await api.post(`/rooms/${roomId}/leave`);
    return response.data;
  },
  async archiveRoom(roomId) {
    const response = await api.post(`/rooms/${roomId}/archive`);
    return response.data;
  },
  async getRoomMessages(roomId, page = 0, size = 50) {
    const response = await api.get(`/rooms/${roomId}/messages?page=${page}&size=${size}`);
    return response.data;
  },
  async getRoomMembers(roomId) {
    const response = await api.get(`/rooms/${roomId}/members`);
    return response.data;
  },
  async sendRoomMessage(roomId, payload) {
    const response = await api.post(`/messages/room/${roomId}`, payload);
    return response.data;
  },
  async editMessage(messageId, content) {
    const response = await api.put(`/messages/${messageId}`, { content, type: 'TEXT' });
    return response.data;
  },
  async deleteMessage(messageId) {
    const response = await api.delete(`/messages/${messageId}`);
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
};

export default chatService;
