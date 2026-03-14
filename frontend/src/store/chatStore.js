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
  setNotifications: (notifications) => set({ notifications }),
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
    .sort((left, right) => new Date(left.sentAt).getTime() - new Date(right.sentAt).getTime())
    .forEach((message) => map.set(message.id, message));
  return [...map.values()];
}

export default useChatStore;
