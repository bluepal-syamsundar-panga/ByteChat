import { MessageSquareShare, Sparkles, MoreVertical, SmilePlus, Pencil, Trash2, Pin, Paperclip, X } from 'lucide-react';
import { useEffect, useRef, useState, useMemo } from 'react';
import EmojiPicker from 'emoji-picker-react';
import dmService from '../../services/dmService';
import chatService from '../../services/chatService';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { connectWebSocket, subscribeToDM } from '../../services/websocket';

const DMChatWindow = ({ user }) => {
  const currentUser = useAuthStore((state) => state.user);
  const { dmMessages, setDmMessages, appendDmMessage, upsertDmMessage, sharedUsers } = useChatStore();
  const [loading, setLoading] = useState(true);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const scrollRef = useRef(null);
  const messageContainerRef = useRef(null);
  const menuRef = useRef(null);
  const emojiPickerRef = useRef(null);
  
  const thread = dmMessages[user?.id] ?? [];
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const selectedMessage = useMemo(() => 
    thread.find(m => m.id === selectedMessageId), 
    [thread, selectedMessageId]
  );

  const pinnedMessages = useMemo(() => 
    thread.filter(m => m.isPinned),
    [thread]
  );

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

  const scrollToBottom = (behavior = 'smooth') => {
    scrollRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    let mounted = true;
    setIsFirstLoad(true);

    async function loadConversation(isInitial = false) {
      try {
        if (isInitial) setLoading(true);
        const response = await dmService.getDirectMessages(user.id);
        if (mounted) {
          console.log('DM Response:', response);
          console.log('DM Response Data:', response.data);
          
          // Handle ApiResponse wrapper: response.data.data.content
          const messagesData = response.data?.data || response.data || response;
          const newMessages = [...(messagesData.content ?? messagesData ?? [])].reverse();
          
          console.log('Processed DM Messages:', newMessages);
          console.log('DM Messages Count:', newMessages.length);
          
          // Check if we should scroll before updating state
          const container = messageContainerRef.current;
          const isAtBottom = container ? (container.scrollHeight - container.scrollTop <= container.clientHeight + 100) : true;

          setDmMessages(user.id, newMessages);
          await dmService.markAsRead(user.id);
          
          // Clear DM notifications in local store
          const { setNotifications } = useChatStore.getState();
          setNotifications(prev => prev.map(n => 
            (n.type === 'DIRECT_MESSAGE') ? { ...n, isRead: true, read: true } : n
          ));

          if (isInitial) {
            // Instant scroll on first load
            setTimeout(() => {
              scrollToBottom('auto');
              setIsFirstLoad(false);
            }, 50);
          } else if (isAtBottom) {
            scrollToBottom('smooth');
          }
        }
      } catch (error) {
        console.error('Failed to load DM thread', error);
      } finally {
        if (mounted && isInitial) {
          setLoading(false);
        }
      }
    }

    loadConversation(true);
    
    // Subscribe to WebSocket for real-time DM updates
    connectWebSocket(() => {
      subscribeToDM(currentUser.id, (message) => {
        if (mounted && (message.senderId === user.id || message.senderId === currentUser.id)) {
          const container = messageContainerRef.current;
          const isAtBottom = container ? (container.scrollHeight - container.scrollTop <= container.clientHeight + 100) : true;
          appendDmMessage(user.id, message);
          if (isAtBottom) setTimeout(() => scrollToBottom('smooth'), 50);
        }
      });
    });

    return () => {
      mounted = false;
    };
  }, [setDmMessages, appendDmMessage, user?.id, currentUser?.id]);

  async function handleSend(content, file) {
    try {
      let fileUrl = null;
      
      // 1. Upload file if present (using chatService as it has the upload logic)
      if (file) {
        const resp = await chatService.uploadFile(file);
        fileUrl = resp?.data?.fileUrl || resp?.fileUrl;
      }

      // 2. Send file message if file was uploaded
      if (fileUrl) {
        const fileApiResponse = await dmService.sendDirectMessage(user.id, fileUrl);
        const sentFileMessage = fileApiResponse?.data ?? fileApiResponse;
        if (sentFileMessage?.id) {
          appendDmMessage(user.id, sentFileMessage);
        }
      }

      // 3. Send text message if content is present
      if (content && content.trim()) {
        const textApiResponse = await dmService.sendDirectMessage(user.id, content);
        const sentTextMessage = textApiResponse?.data ?? textApiResponse;
        if (sentTextMessage?.id) {
          appendDmMessage(user.id, sentTextMessage);
        }
      }

      setTimeout(() => scrollToBottom('smooth'), 50);
    } catch (error) {
      console.error('Failed to send DM:', error);
      alert('Failed to send message. Please try again.');
    }
  }

  async function handleEdit(message) {
    const nextContent = window.prompt('Edit message', message.content);
    if (!nextContent || nextContent === message.content) return;

    try {
      const response = await dmService.editMessage(message.id, nextContent);
      upsertDmMessage(user.id, response.data || response);
    } catch (err) {
      console.error('Failed to edit DM', err);
    }
  }

  async function handleDelete(message) {
    if (!window.confirm('Delete this message?')) return;
    try {
      const response = await dmService.deleteMessage(message.id);
      upsertDmMessage(user.id, response.data || response);
    } catch (err) {
      console.error('Failed to delete DM', err);
    }
  }

  async function handlePin(message) {
    try {
      const response = await dmService.pinMessage(message.id);
      upsertDmMessage(user.id, response.data || response);
    } catch (err) {
      console.error('Failed to pin DM', err);
    }
  }

  async function handleReact(message, emoji) {
    if (!emoji) return;
    try {
      const response = await dmService.reactToMessage(message.id, emoji);
      upsertDmMessage(user.id, response.data || response);
    } catch (err) {
      console.error('Failed to react to DM', err);
    }
  }

  if (!user) {
    return <EmptyState title="Select a direct message" description="Open a teammate from the DM list to start chatting." />;
  }

  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="flex items-center justify-between border-b border-black/5 px-5 py-4">
        <div>
          <div className="text-lg font-semibold">{user.displayName}</div>
          <div className="mt-1 text-sm text-[#6b6a6b]">{user.email}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-black/5 px-3 py-1.5 text-sm text-[#6b6a6b] border border-black/5">
            <Sparkles size={14} className="mr-1 inline" />
            Private conversation
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
              </div>
            )}
          </div>
        </div>
      </header>

      <div ref={messageContainerRef} className="scrollbar-thin flex-1 overflow-y-auto">
        {loading ? (
          <EmptyState title="Loading conversation" description="Fetching direct message history." />
        ) : thread.length === 0 ? (
          <EmptyState title="No direct messages yet" description={`Say hello to ${user.displayName}.`} />
        ) : (
          <>
            {pinnedMessages.length > 0 && (
              <div className="sticky top-0 z-10 flex items-center justify-between bg-white/80 backdrop-blur-sm px-5 py-3 border-b border-black/5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff7d6] text-[#8c5b00]">
                    <Pin size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#1d1c1d]">
                      {pinnedMessages.length} pinned {pinnedMessages.length === 1 ? 'message' : 'messages'}
                    </div>
                    <div className="text-xs text-[#6b6a6b]">Visible to both participants</div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const lastPinned = pinnedMessages[pinnedMessages.length - 1];
                    setSelectedMessageId(lastPinned.id);
                  }}
                  className="text-sm font-bold text-[#1164a3] hover:underline"
                >
                  View all
                </button>
              </div>
            )}
            {thread.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                isSelected={selectedMessageId === message.id}
                onClick={() => {
                  if (selectedMessageId === message.id) {
                    setSelectedMessageId(null);
                    setShowMenu(false);
                  } else {
                    setSelectedMessageId(message.id);
                    setShowMenu(false);
                  }
                }}
              />
            ))}
          </>
        )}
        <div ref={scrollRef} />
      </div>

      <MessageInput 
        placeholder={`Message ${user.displayName}`} 
        onSendMessage={handleSend} 
        mentionSuggestions={[user]}
        currentUserId={currentUser.id}
      />
    </section>
  );
};

const EmptyState = ({ title, description }) => (
  <div className="flex h-full min-h-[240px] flex-col items-center justify-center px-6 text-center">
    <div className="text-xl font-semibold">{title}</div>
    <div className="mt-2 max-w-md text-sm leading-6 text-[#6b6a6b]">{description}</div>
    <div className="mt-4 bg-[#f1e8f3] px-3 py-1.5 text-sm text-[#611f69] border border-[#611f69]/10">
      <MessageSquareShare size={14} className="mr-1 inline" />
      DMs now use real-time WebSocket updates!
    </div>
  </div>
);

export default DMChatWindow;
