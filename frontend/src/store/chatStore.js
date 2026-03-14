import { create } from 'zustand';

const useChatStore = create((set, get) => ({
  rooms: [],
  activeRoom: null,
  messages: [],
  onlineUsers: [],
  
  setRooms: (rooms) => set({ rooms }),
  addRoom: (room) => set((state) => ({ rooms: [...state.rooms, room] })),
  setActiveRoom: (room) => set({ activeRoom: room }),
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => {
    const currentMessages = get().messages;
    if (!currentMessages.some(m => m.id === message.id)) {
      set({ messages: [...currentMessages, message] }); // Append to end
    }
  },
  
  updateMessage: (updatedMessage) => {
    set({
      messages: get().messages.map(m => m.id === updatedMessage.id ? updatedMessage : m)
    });
  },
  
  removeMessage: (messageId) => {
    set({
      messages: get().messages.map(m => m.id === messageId ? { ...m, content: 'This message was deleted.', isDeleted: true } : m)
    });
  },
  
  setOnlineUsers: (users) => set({ onlineUsers: users })
}));

export default useChatStore;
