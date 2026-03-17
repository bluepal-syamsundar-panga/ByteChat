import api from './api';

const channelService = {
  createChannel: (workspaceId, name, description, isPrivate) => 
    api.post(`/channels/workspace/${workspaceId}`, null, {
      params: { name, description, isPrivate }
    }),
  getWorkspaceChannels: (workspaceId) => api.get(`/channels/workspace/${workspaceId}`),
  getArchivedChannels: (workspaceId) => api.get(`/channels/workspace/${workspaceId}/archived`),
  getDeletedChannels: (workspaceId) => api.get(`/channels/workspace/${workspaceId}/deleted`),
  inviteUser: (channelId, email) => api.post(`/channels/${channelId}/invite`, { email }),
  leaveChannel: (channelId) => api.post(`/channels/${channelId}/leave`),
  deleteChannel: (channelId) => api.delete(`/channels/${channelId}`),
  permanentlyDeleteChannel: (channelId) => api.delete(`/channels/${channelId}/permanent`),
  restoreChannel: (channelId) => api.post(`/channels/${channelId}/restore`),
  archiveChannel: (channelId) => api.post(`/channels/${channelId}/archive`),
  transferOwnership: (channelId, newOwnerId) => api.post(`/channels/${channelId}/transfer-ownership`, null, {
    params: { newOwnerId }
  }),
};

export default channelService;
