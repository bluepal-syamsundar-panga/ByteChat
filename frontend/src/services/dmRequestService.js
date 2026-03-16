import api from './api';

const dmRequestService = {
  async sendRequest(receiverId) {
    const response = await api.post(`/dm/requests/send/${receiverId}`);
    return response.data;
  },
  async acceptRequest(requestId) {
    const response = await api.post(`/dm/requests/accept/${requestId}`);
    return response.data;
  },
  async rejectRequest(requestId) {
    const response = await api.post(`/dm/requests/reject/${requestId}`);
    return response.data;
  },
  async getPendingRequests() {
    const response = await api.get('/dm/requests/pending');
    return response.data;
  }
};

export default dmRequestService;
