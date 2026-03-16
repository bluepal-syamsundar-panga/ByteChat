import { Hash, Pin, Users, MoreVertical, SmilePlus, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import chatService from '../../services/chatService';
import {
  connectWebSocket,
  publishRoomMessage,
  publishTyping,
  subscribeToRoom,
  subscribeToTyping,
} from '../../services/websocket';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import notificationService from '../../services/notificationService';
import Modal from '../Shared/Modal';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';

const ChatWindow = ({ room }) => {
  const currentUser = useAuthStore((state) => state.user);
  const {
    roomMessages,
    onlineUsers,
    typingByRoom,
    setRoomMessages,
    appendRoomMessage,
    upsertRoomMessage,
    setTyping,
  } = useChatStore();
  const [loading, setLoading] = useState(true);
  const [roomMembers, setRoomMembers] = useState([]);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  
  const scrollRef = useRef(null);
  const messageContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const menuRef = useRef(null);
  const emojiPickerRef = useRef(null);
  
  const roomId = room?.id;
  const messages = roomMessages[roomId] ?? [];
  const selectedMessage = useMemo(() => 
    messages.find(m => m.id === selectedMessageId), 
    [messages, selectedMessageId]
  );

  const scrollToBottom = (behavior = 'smooth') => {
    scrollRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    let mounted = true;
    setLoading(true);

    async function loadRoom() {
      try {
        const [messagesResponse, membersResponse] = await Promise.all([
          chatService.getRoomMessages(roomId),
          chatService.getRoomMembers(roomId),
        ]);
        if (!mounted) {
          return;
        }

        const newMessages = [...(messagesResponse.data?.content ?? [])].reverse();
        setRoomMessages(roomId, newMessages);
        setRoomMembers(membersResponse.data ?? []);

        // Auto-clear room notifications (mentions)
        try {
          await notificationService.markRoomRead(roomId);
          // Update local store to remove these from panels
          const { setNotifications } = useChatStore.getState();
          setNotifications(prev => prev.map(n => 
            (n.type === 'MENTION' && n.relatedEntityId === roomId) ? { ...n, isRead: true, read: true } : n
          ));
        } catch (e) {
          console.error('Failed to clear room notifications', e);
        }

        // Instant scroll on room switch
        setTimeout(() => {
          scrollToBottom('auto');
        }, 50);

        connectWebSocket(() => {
          subscribeToRoom(roomId, (message) => {
            console.log('[DEBUG] Received message via WebSocket:', message);
            if (mounted) {
              const container = messageContainerRef.current;
              const isAtBottom = container ? (container.scrollHeight - container.scrollTop <= container.clientHeight + 100) : true;
              
              appendRoomMessage(roomId, message);
              
              if (isAtBottom) {
                setTimeout(() => scrollToBottom('smooth'), 50);
              }
            }
          });
          subscribeToTyping(roomId, (event) => {
            setTyping(roomId, {
              [event.userId]: event.isTyping ? event.displayName : null,
            });
          });
        });
      } catch (error) {
        console.error('Failed to load room', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadRoom();

    return () => {
      mounted = false;
    };
  }, [roomId, appendRoomMessage, setRoomMessages, setTyping]);

  const typingUsers = useMemo(() => {
    const entries = Object.entries(typingByRoom[roomId] ?? {});
    return entries
      .filter(([userId, name]) => name && Number(userId) !== currentUser?.id)
      .map(([, name]) => name);
  }, [currentUser?.id, roomId, typingByRoom]);

  async function handleSend(content) {
    try {
      const payload = { content, type: 'TEXT' };
      const response = await chatService.sendRoomMessage(roomId, payload);
      // We don't append here because we expect the WebSocket broadcast
      // This helps avoid double-rendering if the broadcast is fast
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please check your connection.');
    }
    setTimeout(() => scrollToBottom('smooth'), 50);
  }

  async function handleUpload(file) {
    try {
      const resp = await chatService.uploadFile(file);
      if (resp && resp.data && resp.data.fileUrl) {
        const payload = { content: resp.data.fileUrl, type: 'FILE' };
        const sentOverWebSocket = publishRoomMessage(roomId, payload);
        if (!sentOverWebSocket) {
          const response = await chatService.sendRoomMessage(roomId, payload);
          appendRoomMessage(roomId, response.data);
        }
      }
    } catch (e) {
      console.error('File upload failed', e);
      alert('Failed to upload file.');
    }
  }

  async function handleEdit(message) {
    const nextContent = window.prompt('Edit message', message.content);
    if (!nextContent || nextContent === message.content) {
      return;
    }

    const response = await chatService.editMessage(message.id, nextContent);
    upsertRoomMessage(roomId, response.data);
  }

  async function handleInviteSubmit(e) {
    if (e) e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      await chatService.inviteUser(roomId, inviteEmail.trim());
      window.alert('Invite sent');
      setShowInviteModal(false);
      setInviteEmail('');
    } catch (error) {
      window.alert(error.response?.data?.message ?? 'Unable to send invite');
    }
  }

  async function handleDelete(message) {
    if (!window.confirm('Delete this message?')) {
      return;
    }

    await chatService.deleteMessage(message.id);
    upsertRoomMessage(roomId, {
      ...message,
      content: 'This message was deleted.',
      isDeleted: true,
    });
  }

  async function handlePin(message) {
    const response = await chatService.pinMessage(message.id);
    upsertRoomMessage(roomId, response.data);
  }

  async function handleReact(message, emoji) {
    if (!emoji) {
      return;
    }
    
    // Optimistic update
    const currentUserReaction = {
      emoji,
      userId: currentUser.id,
      username: currentUser.displayName
    };
    
    const updatedMessage = {
      ...message,
      reactions: [...(message.reactions || []), currentUserReaction]
    };
    
    upsertRoomMessage(roomId, updatedMessage);
    
    try {
      await chatService.reactToMessage(message.id, emoji);
    } catch (e) {
      console.error('Failed to react', e);
      // Rollback on failure (optional, but good practice)
      upsertRoomMessage(roomId, message);
    }
  }

  const pinnedMessages = useMemo(() => 
    messages.filter(m => m.isPinned),
    [messages]
  );

  function handleTyping(isTyping) {
    publishTyping(roomId, {
      userId: currentUser?.id,
      displayName: currentUser?.displayName,
      isTyping,
    });

    window.clearTimeout(typingTimeoutRef.current);
    if (isTyping) {
      typingTimeoutRef.current = window.setTimeout(() => {
        publishTyping(roomId, {
          userId: currentUser?.id,
          displayName: currentUser?.displayName,
          isTyping: false,
        });
      }, 1800);
    }
  }

  if (!room) {
    return (
      <EmptyState
        title="Select a channel"
        description="Choose a room from the sidebar or create a new one."
      />
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="flex items-center justify-between border-b border-black/5 px-5 py-4">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Hash size={18} className="text-[#6b6a6b]" />
            {room.name}
          </div>
          <div className="mt-1 text-sm text-[#6b6a6b]">
            {room.description || 'Real-time room conversation'}
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-[#6b6a6b]">
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="bg-[#3f0e40] px-3 py-1.5 text-white transition hover:bg-[#350d36]"
          >
            Invite member
          </button>

          <div className="bg-black/5 px-3 py-1.5 flex items-center">
            <Users size={14} className="mr-1 inline" />
            {roomMembers.length} members
          </div>
          
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              disabled={!selectedMessage}
              className={`p-1.5 border border-black/5 transition flex items-center justify-center ${
                showMenu ? 'bg-black/10 text-black' : 
                selectedMessage ? 'hover:bg-black/5 text-[#6b6a6b] cursor-pointer' : 
                'text-[#6b6a6b]/30 cursor-not-allowed'
              }`}
            >
              <MoreVertical size={20} />
            </button>
            
            {showMenu && selectedMessage && (
              <div className="absolute right-0 top-full mt-2 w-48 border border-black/10 bg-white shadow-xl z-50 py-1 flex flex-col overflow-hidden">
                <div className="relative" ref={emojiPickerRef}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEmojiPicker(!showEmojiPicker);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[#1d1c1d] transition hover:bg-black/5"
                  >
                    <SmilePlus size={16} className="text-[#6b6a6b]" /> React
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute right-full top-0 mr-2 z-50">
                      <EmojiPicker 
                        onEmojiClick={(emojiData) => {
                          handleReact(selectedMessage, emojiData.emoji);
                          setShowEmojiPicker(false);
                          setShowMenu(false);
                          setSelectedMessageId(null);
                        }}
                        autoFocusSearch={false}
                        theme="light"
                      />
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => {
                    handlePin(selectedMessage);
                    setShowMenu(false);
                    setSelectedMessageId(null);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[#1d1c1d] transition hover:bg-black/5"
                >
                  <Pin size={16} className="text-[#6b6a6b]" /> 
                  {selectedMessage.isPinned ? 'Unpin' : 'Pin'}
                </button>

                {selectedMessage.senderId === currentUser?.id && !selectedMessage.isDeleted && (
                  <>
                    <button 
                      onClick={() => {
                        handleEdit(selectedMessage);
                        setShowMenu(false);
                        setSelectedMessageId(null);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[#1d1c1d] transition hover:bg-black/5"
                    >
                      <Pencil size={16} className="text-[#6b6a6b]" /> Edit
                    </button>
                    <button 
                      onClick={() => {
                        handleDelete(selectedMessage);
                        setShowMenu(false);
                        setSelectedMessageId(null);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[#e01e5a] transition hover:bg-[#e01e5a]/10"
                    >
                      <Trash2 size={16} className="text-[#e01e5a]" /> Delete
                    </button>
                  </>
                )}
                <button 
                  onClick={() => {
                    setShowInviteModal(true);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[#1d1c1d] transition hover:bg-black/5 lg:hidden"
                >
                  <Users size={16} className="text-[#6b6a6b]" /> Invite member
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div ref={messageContainerRef} className="scrollbar-thin flex-1 overflow-y-auto">
        {pinnedMessages.length > 0 && (
          <div className="sticky top-0 z-10 flex items-center justify-between bg-[#fff7d6] px-5 py-2 border-b border-black/5">
            <div className="flex items-center gap-2 text-sm font-medium text-[#8c5b00]">
              <Pin size={14} />
              <span>{pinnedMessages.length} pinned {pinnedMessages.length === 1 ? 'message' : 'messages'}</span>
            </div>
            <button 
              onClick={() => {
                const lastPinned = pinnedMessages[pinnedMessages.length - 1];
                setSelectedMessageId(lastPinned.id);
                // Scroll to it would be nice, but for now we just select it
              }}
              className="text-xs font-semibold text-[#1164a3] hover:underline"
            >
              View latest
            </button>
          </div>
        )}

        {loading ? (
          <EmptyState
            title="Loading room"
            description="Fetching latest message history and live subscriptions."
          />
        ) : messages.length === 0 ? (
          <EmptyState
            title="No messages yet"
            description="Start the room with a welcome note or a mention."
          />
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isSelected={selectedMessageId === message.id}
              onClick={() => {
                if (selectedMessageId === message.id) {
                  setSelectedMessageId(null);
                  setShowMenu(false);
                  setShowEmojiPicker(false);
                } else {
                  setSelectedMessageId(message.id);
                  setShowMenu(false);
                  setShowEmojiPicker(false);
                }
              }}
            />
          ))
        )}
        <div ref={scrollRef} />
      </div>

      <TypingIndicator users={typingUsers} />

      <MessageInput
        placeholder={`Message #${room.name}`}
        onSendMessage={handleSend}
        onTyping={handleTyping}
        onUploadFile={handleUpload}
        disabled={false}
        mentionSuggestions={roomMembers}
      />
      <Modal 
        isOpen={showInviteModal} 
        onClose={() => setShowInviteModal(false)} 
        title={`Invite to #${room.name}`}
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6b6a6b]">Email Address</label>
            <input 
              type="email" 
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="mt-1 w-full border border-black/10 bg-[#f8f8f8] px-4 py-2 text-sm focus:border-[#3f0e40] focus:ring-1 focus:ring-[#3f0e40] outline-none"
              placeholder="name@example.com"
              autoFocus
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => setShowInviteModal(false)}
              className="px-4 py-2 text-sm font-semibold text-[#6b6a6b] hover:bg-black/5"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="bg-[#3f0e40] px-4 py-2 text-sm font-semibold text-white hover:bg-[#350d36]"
            >
              Send Invitation
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
};

const EmptyState = ({ title, description }) => (
  <div className="flex h-full min-h-[240px] flex-col items-center justify-center px-6 text-center">
    <div className="text-xl font-semibold">{title}</div>
    <div className="mt-2 max-w-md text-sm leading-6 text-[#6b6a6b]">{description}</div>
  </div>
);

export default ChatWindow;
