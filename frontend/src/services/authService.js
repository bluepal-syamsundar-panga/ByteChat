import api from './api';

const authService = {
  async login(payload) {
    const response = await api.post('/auth/login', payload);
    return response.data;
  },
  async register(payload) {
    const response = await api.post('/auth/register', payload);
    return response.data;
  },
  async sendRegistrationOtp(email) {
    const response = await api.post(`/auth/register/send-otp?email=${email}`);
    return response.data;
  },
  async sendForgotPasswordOtp(email) {
    const response = await api.post(`/auth/forgot-password/send-otp?email=${email}`);
    return response.data;
  },
  async resetPassword(payload) {
    const response = await api.post('/auth/forgot-password/reset', payload);
    return response.data;
  },
  async refresh(refreshToken) {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },
};

export default authService;
