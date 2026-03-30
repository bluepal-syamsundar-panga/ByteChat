import { create } from 'zustand';

const useChatStore = create((set) => ({
  workspaces: [],
  rooms: [], // Kept for backward compatibility during transition if needed, but will alias to workspaces
  channels: [],
  users: [],
  onlineUsers: [],
  notifications: [],
  meetings: [],
  meetingLauncher: null,
  activeMeeting: null,
  sharedUsers: [],
  activeWorkspaceId: null,
  activeThread: null,
  roomMessages: {},
  channelMessages: {},
  dmMessages: {},
  typingByWorkspace: {},
  sidebarMode: 'channels', // 'channels', 'archive', 'trash', 'meetings'
  setSidebarMode: (mode) => set({ sidebarMode: mode }),
  openMeetingLauncher: (payload) => set({ meetingLauncher: payload }),
  closeMeetingLauncher: () => set({ meetingLauncher: null }),
  setActiveMeeting: (meeting) => set({ activeMeeting: meeting }),
  clearActiveMeeting: () => set({ activeMeeting: null }),
  setMeetings: (meetings) =>
    set(() => ({
      meetings: normalizeMeetings(meetings),
    })),
  upsertMeeting: (meeting) =>
    set((state) => ({
      meetings: normalizeMeetings([
        ...(state.meetings ?? []).filter((item) => String(item.id) !== String(meeting?.id)),
        meeting,
      ]),
    })),
  removeMeeting: (meetingId) =>
    set((state) => ({
      meetings: (state.meetings ?? []).filter((item) => String(item.id) !== String(meetingId)),
    })),
  isCreateChannelModalOpen: false,
  setIsCreateChannelModalOpen: (isOpen) => set({ isCreateChannelModalOpen: isOpen }),
  setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
  setWorkspaces: (workspaces) =>
    set((state) => {
      const nextWorkspaces = typeof workspaces === 'function' ? workspaces(state.workspaces) : workspaces;
      return { workspaces: Array.isArray(nextWorkspaces) ? nextWorkspaces : [], rooms: Array.isArray(nextWorkspaces) ? nextWorkspaces : [] };
    }),
  setRooms: (rooms) =>
    set((state) => {
      const nextRooms = typeof rooms === 'function' ? rooms(state.rooms) : rooms;
      return { rooms: Array.isArray(nextRooms) ? nextRooms : [], workspaces: Array.isArray(nextRooms) ? nextRooms : [] };
    }), // Legacy support
  setChannels: (channels) =>
    set((state) => {
      const nextChannels = typeof channels === 'function' ? channels(state.channels) : channels;
      return { channels: Array.isArray(nextChannels) ? nextChannels : [] };
    }),
  sidebarChannels: [],
  setSidebarChannels: (channels) =>
    set((state) => {
      const nextChannels = typeof channels === 'function' ? channels(state.sidebarChannels) : channels;
      return { sidebarChannels: Array.isArray(nextChannels) ? nextChannels : [] };
    }),
  setUsers: (users) =>
    set((state) => {
      const nextUsers = typeof users === 'function' ? users(state.users) : users;
      return { users: Array.isArray(nextUsers) ? nextUsers : [] };
    }),
  setOnlineUsers: (onlineUsers) =>
    set((state) => {
      const nextUsers = typeof onlineUsers === 'function' ? onlineUsers(state.onlineUsers) : onlineUsers;
      return { onlineUsers: Array.isArray(nextUsers) ? nextUsers : [] };
    }),
  setSharedUsers: (sharedUsers) =>
    set((state) => {
      const nextUsers = typeof sharedUsers === 'function' ? sharedUsers(state.sharedUsers) : sharedUsers;
      return { sharedUsers: Array.isArray(nextUsers) ? nextUsers : [] };
    }),
  setNotifications: (notifications) =>
    set((state) => ({
      notifications: normalizeNotifications(
        typeof notifications === 'function'
          ? notifications(state.notifications)
          : notifications
      ),
    })),
  setActiveThread: (activeThread) => set({ activeThread }),
  setRoomMessages: (roomId, messages) =>
    set((state) => ({ roomMessages: { ...state.roomMessages, [roomId]: normalizeMessages(messages) } })),
  setChannelMessages: (channelId, messages) =>
    set((state) => ({ channelMessages: { ...state.channelMessages, [channelId]: normalizeMessages(messages) } })),
  prependChannelMessages: (channelId, messages) =>
    set((state) => ({
      channelMessages: {
        ...state.channelMessages,
        [channelId]: dedupe([...(normalizeMessages(messages) ?? []), ...(state.channelMessages[channelId] ?? [])]),
      },
    })),
  appendRoomMessage: (roomId, message) =>
    set((state) => ({
      roomMessages: {
        ...state.roomMessages,
        [roomId]: dedupe([...(state.roomMessages[roomId] ?? []), normalizeMessage(message)]),
      },
    })),
  appendChannelMessage: (channelId, message) =>
    set((state) => {
      const isCurrent = state.activeThread?.type === 'channel' && String(state.activeThread?.id) === String(channelId);
      return {
        channelMessages: {
          ...state.channelMessages,
        [channelId]: dedupe([...(state.channelMessages[channelId] ?? []), normalizeMessage(message)]),
        },
        channels: isCurrent 
          ? state.channels 
          : state.channels.map(c => c.id === channelId ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } : c),
        sidebarChannels: isCurrent
          ? state.sidebarChannels
          : (state.sidebarChannels || []).map(c => c.id === channelId ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } : c)
      };
    }),
  upsertRoomMessage: (roomId, message) =>
    set((state) => ({
      roomMessages: {
        ...state.roomMessages,
        [roomId]: dedupe([...(state.roomMessages[roomId] ?? []).filter((item) => item.id !== message.id), normalizeMessage(message)]),
      },
    })),
  removeRoomMessage: (roomId, messageId) =>
    set((state) => ({
      roomMessages: {
        ...state.roomMessages,
        [roomId]: (state.roomMessages[roomId] ?? []).filter((item) => item.id !== messageId),
      },
    })),
  upsertChannelMessage: (channelId, message) =>
    set((state) => ({
      channelMessages: {
        ...state.channelMessages,
        [channelId]: dedupe([...(state.channelMessages[channelId] ?? []).filter((item) => item.id !== message.id), normalizeMessage(message)]),
      },
    })),
  removeChannelMessage: (channelId, messageId) =>
    set((state) => ({
      channelMessages: {
        ...state.channelMessages,
        [channelId]: (state.channelMessages[channelId] ?? []).filter((item) => item.id !== messageId),
      },
    })),
  setDmMessages: (userId, messages) =>
    set((state) => ({ dmMessages: { ...state.dmMessages, [userId]: normalizeMessages(messages) } })),
  prependDmMessages: (userId, messages) =>
    set((state) => ({
      dmMessages: {
        ...state.dmMessages,
        [userId]: dedupe([...(normalizeMessages(messages) ?? []), ...(state.dmMessages[userId] ?? [])]),
      },
    })),
  appendDmMessage: (userId, message, options = {}) =>
    set((state) => {
      const isCurrent = state.activeThread?.type === 'dm' && String(state.activeThread?.id) === String(userId);
      const shouldIncrementUnread = Boolean(options.incrementUnread) && !isCurrent;
      return {
        dmMessages: {
          ...state.dmMessages,
          [userId]: dedupe([...(state.dmMessages[userId] ?? []), normalizeMessage(message)]),
        },
        sharedUsers: shouldIncrementUnread
          ? state.sharedUsers.map((u) =>
              String(u.id) === String(userId)
                ? { ...u, unreadCount: (u.unreadCount || 0) + 1 }
                : u
            )
          : state.sharedUsers
      };
    }),
  upsertDmMessage: (userId, message) =>
    set((state) => ({
      dmMessages: {
        ...state.dmMessages,
        [userId]: dedupe([...(state.dmMessages[userId] ?? []).filter((item) => item.id !== message.id), normalizeMessage(message)]),
      },
    })),
  removeDmMessage: (userId, messageId) =>
    set((state) => ({
      dmMessages: {
        ...state.dmMessages,
        [userId]: (state.dmMessages[userId] ?? []).filter((item) => item.id !== messageId),
      },
    })),
  setTyping: (workspaceId, typingState) =>
    set((state) => ({
      typingByWorkspace: {
        ...state.typingByWorkspace,
        [workspaceId]: { ...(state.typingByWorkspace[workspaceId] ?? {}), ...typingState },
      },
    })),
  clearChannelUnread: (channelId) =>
    set((state) => ({
      channels: state.channels.map((c) =>
        c.id === channelId ? { ...c, unreadCount: 0 } : c
      ),
      sidebarChannels: (state.sidebarChannels || []).map((c) =>
        c.id === channelId ? { ...c, unreadCount: 0 } : c
      ),
    })),
  incrementChannelUnread: (channelId) =>
    set((state) => ({
      channels: state.channels.map((c) =>
        c.id === channelId ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } : c
      ),
      sidebarChannels: (state.sidebarChannels || []).map((c) =>
        c.id === channelId ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } : c
      ),
    })),
  clearDmUnread: (userId) =>
    set((state) => ({
      sharedUsers: state.sharedUsers.map((u) =>
        String(u.id) === String(userId) ? { ...u, unreadCount: 0 } : u
      ),
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
        map.set(message.id, normalizeMessage(message));
      }
    });
  return [...map.values()];
}

function normalizeMessages(messages) {
  return (messages ?? []).map(normalizeMessage);
}

function normalizeNotifications(notifications) {
  const map = new Map();

  (Array.isArray(notifications) ? notifications : []).forEach((notification) => {
    if (!notification) {
      return;
    }

    const key = notification.id ?? `${notification.type}:${notification.relatedEntityId}:${notification.createdAt}`;
    map.set(key, notification);
  });

  return [...map.values()].sort((left, right) => {
    const leftTime = new Date(left?.createdAt ?? 0).getTime() || 0;
    const rightTime = new Date(right?.createdAt ?? 0).getTime() || 0;
    return rightTime - leftTime;
  });
}

function normalizeMessage(message) {
  if (!message) return message;
  return {
    ...message,
    sentAt: normalizeDateValue(message.sentAt),
    editedAt: normalizeDateValue(message.editedAt),
    isDeleted: message.isDeleted ?? message.deleted ?? false,
    isPinned: message.isPinned ?? message.pinned ?? false,
  };
}

function normalizeMeetings(meetings) {
  return (Array.isArray(meetings) ? meetings : [])
    .filter(Boolean)
    .sort((left, right) => {
      const leftTime = new Date(left?.createdAt ?? 0).getTime() || 0;
      const rightTime = new Date(right?.createdAt ?? 0).getTime() || 0;
      return rightTime - leftTime;
    });
}

function normalizeDateValue(value) {
  if (!value) return value;
  if (Array.isArray(value) && value.length >= 6) {
    const date = new Date(value[0], value[1] - 1, value[2], value[3], value[4], value[5]);
    return Number.isNaN(date.getTime()) ? value : date.toISOString();
  }
  return value;
}

export default useChatStore;
