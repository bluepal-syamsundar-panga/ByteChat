import api from './api';

const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (email, password, displayName) => {
    const response = await api.post('/auth/register', { email, password, displayName });
    return response.data;
  }
};

export default authService;
