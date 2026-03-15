import { create } from 'zustand';

const useChatStore = create((set) => ({
  rooms: [],
  users: [],
  onlineUsers: [],
  notifications: [],
  activeThread: null,
  roomMessages: {},
  dmMessages: {},
  typingByRoom: {},
  setRooms: (rooms) => set({ rooms }),
  setUsers: (users) => set({ users }),
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
  setNotifications: (notifications) =>
    set((state) => ({
      notifications: typeof notifications === 'function'
        ? notifications(state.notifications)
        : notifications,
    })),
  setActiveThread: (activeThread) => set({ activeThread }),
  setRoomMessages: (roomId, messages) =>
    set((state) => ({ roomMessages: { ...state.roomMessages, [roomId]: messages } })),
  appendRoomMessage: (roomId, message) =>
    set((state) => ({
      roomMessages: {
        ...state.roomMessages,
        [roomId]: dedupe([...(state.roomMessages[roomId] ?? []), message]),
      },
    })),
  upsertRoomMessage: (roomId, message) =>
    set((state) => ({
      roomMessages: {
        ...state.roomMessages,
        [roomId]: dedupe([...(state.roomMessages[roomId] ?? []).filter((item) => item.id !== message.id), message]),
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
  setTyping: (roomId, typingState) =>
    set((state) => ({
      typingByRoom: {
        ...state.typingByRoom,
        [roomId]: { ...(state.typingByRoom[roomId] ?? {}), ...typingState },
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
