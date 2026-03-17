import { create } from 'zustand';

const useChatStore = create((set) => ({
  workspaces: [],
  rooms: [], // Kept for backward compatibility during transition if needed, but will alias to workspaces
  channels: [],
  users: [],
  onlineUsers: [],
  notifications: [],
  sharedUsers: [],
  activeWorkspaceId: null,
  activeThread: null,
  roomMessages: {},
  channelMessages: {},
  dmMessages: {},
  typingByWorkspace: {},
  sidebarMode: 'channels', // 'channels', 'archive', 'trash'
  setSidebarMode: (mode) => set({ sidebarMode: mode }),
  isCreateChannelModalOpen: false,
  setIsCreateChannelModalOpen: (isOpen) => set({ isCreateChannelModalOpen: isOpen }),
  setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
  setWorkspaces: (workspaces) => set({ workspaces, rooms: workspaces }),
  setRooms: (rooms) => set({ rooms, workspaces: rooms }), // Legacy support
  setChannels: (channels) => set({ channels }),
  setUsers: (users) => set({ users }),
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
  setSharedUsers: (sharedUsers) => set({ sharedUsers }),
  setNotifications: (notifications) =>
    set((state) => ({
      notifications: typeof notifications === 'function'
        ? notifications(state.notifications)
        : notifications,
    })),
  setActiveThread: (activeThread) => set({ activeThread }),
  setRoomMessages: (roomId, messages) =>
    set((state) => ({ roomMessages: { ...state.roomMessages, [roomId]: messages } })),
  setChannelMessages: (channelId, messages) =>
    set((state) => ({ channelMessages: { ...state.channelMessages, [channelId]: messages } })),
  appendRoomMessage: (roomId, message) =>
    set((state) => ({
      roomMessages: {
        ...state.roomMessages,
        [roomId]: dedupe([...(state.roomMessages[roomId] ?? []), message]),
      },
    })),
  appendChannelMessage: (channelId, message) =>
    set((state) => ({
      channelMessages: {
        ...state.channelMessages,
        [channelId]: dedupe([...(state.channelMessages[channelId] ?? []), message]),
      },
    })),
  upsertRoomMessage: (roomId, message) =>
    set((state) => ({
      roomMessages: {
        ...state.roomMessages,
        [roomId]: dedupe([...(state.roomMessages[roomId] ?? []).filter((item) => item.id !== message.id), message]),
      },
    })),
  upsertChannelMessage: (channelId, message) =>
    set((state) => ({
      channelMessages: {
        ...state.channelMessages,
        [channelId]: dedupe([...(state.channelMessages[channelId] ?? []).filter((item) => item.id !== message.id), message]),
      },
    })),
  setDmMessages: (userId, messages) =>
    set((state) => ({ dmMessages: { ...state.dmMessages, [userId]: messages } })),
  appendDmMessage: (userId, message) =>
    set((state) => ({
      dmMessages: {
        ...state.dmMessages,
        [userId]: dedupe([...(state.dmMessages[userId] ?? []), message]),
      },
    })),
  setTyping: (workspaceId, typingState) =>
    set((state) => ({
      typingByWorkspace: {
        ...state.typingByWorkspace,
        [workspaceId]: { ...(state.typingByWorkspace[workspaceId] ?? {}), ...typingState },
      },
    })),
}));

function dedupe(messages) {
  const map = new Map();
  messages
    .slice()
    .sort((left, right) => {
      const getMillis = (dateVal) => {
        if (!dateVal) return 0;
        // Handle Jackson array format [YYYY, MM, DD, HH, mm, ss]
        if (Array.isArray(dateVal)) {
          return new Date(dateVal[0], dateVal[1] - 1, dateVal[2], dateVal[3], dateVal[4], dateVal[5]).getTime();
        }
        return new Date(dateVal).getTime() || 0;
      };
      return getMillis(left.sentAt) - getMillis(right.sentAt);
    })
    .forEach((message) => {
      if (message && message.id) {
        map.set(message.id, message);
      }
    });
  return [...map.values()];
}

export default useChatStore;
