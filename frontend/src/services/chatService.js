import api from './api';

const chatService = {
  getRooms: async (page = 0, size = 50) => {
    const response = await api.get(`/rooms?page=${page}&size=${size}`);
    return response.data;
  },
  createRoom: async (name, description = "New room") => {
    const response = await api.post('/rooms', { name, description });
    return response.data;
  },
  getRoomMessages: async (roomId, page = 0, size = 50) => {
    const response = await api.get(`/rooms/${roomId}/messages?page=${page}&size=${size}`);
    return response.data;
  },
  pinMessage: async (messageId) => {
    const response = await api.post(`/messages/${messageId}/pin`);
    return response.data;
  },
  deleteMessage: async (messageId) => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },
  editMessage: async (messageId, content) => {
    const response = await api.put(`/messages/${messageId}`, { content, type: 'TEXT' });
    return response.data;
  }
};

export default chatService;
