import api from './api';

const workspaceService = {
  sendOtp: (email) => api.post(`/workspaces/send-otp?email=${email}`),
  verifyOtp: (email, code) => api.post(`/workspaces/verify-otp?email=${email}&code=${code}`),
  createWorkspace: (email, data) => api.post(`/workspaces/create?email=${email}`, data),
  getWorkspaces: (page = 0, size = 50) => api.get(`/workspaces?page=${page}&size=${size}`),
  getWorkspaceMembers: (workspaceId) => api.get(`/workspaces/${workspaceId}/members`),
  inviteToWorkspace: (workspaceId, email) => api.post(`/workspaces/${workspaceId}/invite`, { email }),
};

export default workspaceService;
