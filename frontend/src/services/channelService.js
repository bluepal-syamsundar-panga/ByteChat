import api from './api';

const channelService = {
  createChannel: (workspaceId, name, description) => 
    api.post(`/channels/workspace/${workspaceId}?name=${name}${description ? `&description=${description}` : ''}`),
  getWorkspaceChannels: (workspaceId) => api.get(`/channels/workspace/${workspaceId}`),
  inviteUser: (channelId, email) => api.post(`/channels/${channelId}/invite`, { email }),
};

export default channelService;
