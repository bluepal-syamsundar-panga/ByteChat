import { MessageSquareShare, Sparkles, MoreVertical, SmilePlus, Pencil, Trash2, Pin, Paperclip, X, Users2 } from 'lucide-react';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import EmojiPicker from 'emoji-picker-react';
import dmService from '../../services/dmService';
import chatService from '../../services/chatService';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import { connectWebSocket, subscribeToDM, subscribeToTyping, publishTyping } from '../../services/websocket';

const DMChatWindow = ({ user }) => {
  const currentUser = useAuthStore((state) => state.user);
  const { dmMessages, setDmMessages, appendDmMessage, upsertDmMessage, sharedUsers, setActiveThread, clearDmUnread } = useChatStore();
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
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);

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
          clearDmUnread(user.id);
          
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
    let dmSub;
    let typingSub;
    connectWebSocket(() => {
      dmSub = subscribeToDM(currentUser.id, (message) => {
        if (mounted && (message.senderId === user.id || message.senderId === currentUser.id)) {
          const container = messageContainerRef.current;
          const isAtBottom = container ? (container.scrollHeight - container.scrollTop <= container.clientHeight + 100) : true;
          appendDmMessage(user.id, message);
          if (isAtBottom) setTimeout(() => scrollToBottom('smooth'), 50);
        }
      });

      // Subscribe to DM typing
      typingSub = subscribeToTyping('direct', (data) => {
        if (data.targetUserId === currentUser.id && data.userId === user.id) {
          setTypingUser(data.isTyping ? data : null);
          if (data.isTyping) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
          }
        }
      });
    });

    if (user?.id) {
      setActiveThread({ type: 'dm', id: user.id });
    }

    return () => {
      mounted = false;
      dmSub?.unsubscribe();
      typingSub?.unsubscribe();
      setActiveThread(null);
    };
  }, [setDmMessages, appendDmMessage, user?.id, currentUser?.id, setActiveThread, clearDmUnread]);

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
    
    // Optimistic update: toggle reaction
    const alreadyReacted = message.reactions?.find(r => r.emoji === emoji && String(r.userId) === String(currentUser.id));
    
    let updatedReactions;
    if (alreadyReacted) {
      updatedReactions = message.reactions.filter(r => r !== alreadyReacted);
    } else {
      const currentUserReaction = {
        emoji,
        userId: currentUser.id,
        username: currentUser.displayName
      };
      updatedReactions = [...(message.reactions || []), currentUserReaction];
    }

    const updatedMessage = {
      ...message,
      reactions: updatedReactions
    };

    try {
      const response = await dmService.reactToMessage(message.id, emoji);
      upsertDmMessage(user.id, response.data || response);
      setSelectedMessageId(null);
      setShowMenu(false);
    } catch (err) {
      console.error('Failed to react to DM', err);
    }
  }

  function handleTyping(isTyping) {
    if (!currentUser?.id) return;
    publishTyping('direct', {
      userId: currentUser.id,
      displayName: currentUser.displayName,
      avatar: currentUser.avatarUrl,
      isTyping,
      targetUserId: user.id
    });
  }

  if (!user) {
    return <EmptyState title="Select a direct message" description="Open a teammate from the DM list to start chatting." />;
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-white overflow-hidden">
      <header className="flex items-center justify-between border-b border-gray-100 px-8 py-2.5 bg-white/50 backdrop-blur-md sticky top-0 z-20">
        {loading && (
          <div className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-100 overflow-hidden">
            <div className="h-full bg-indigo-500 skeleton-loading" style={{ width: '40%' }}></div>
          </div>
        )}
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#611f69] to-[#3f0e40] text-white font-extrabold text-lg shadow-md shadow-purple-900/10">
            {user.displayName?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div>
            <div className="text-lg font-black tracking-tight text-gray-900 leading-none">{user.displayName}</div>
            <div className="mt-1 text-[11px] font-bold text-gray-400">{user.email}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
            <Sparkles size={14} />
            Private DM
          </div>
          
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              disabled={!selectedMessage}
              className={`h-9 w-9 rounded-lg transition-smooth flex items-center justify-center ${
                showMenu ? 'bg-black/5 text-gray-900' : 
                selectedMessage ? 'text-gray-400 hover:text-gray-900 hover:bg-black/5' : 
                'text-gray-200 cursor-not-allowed opacity-50'
              }`}
            >
              <MoreVertical size={20} />
            </button>
            
            {showMenu && selectedMessage && (
              <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-2xl z-50 py-2 border border-black/5 animate-in fade-in slide-in-from-top-4 duration-300 origin-top-right">
                <div className="px-4 py-1.5 border-b border-black/5 mb-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#6b6a6b]">Message Options</div>
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
          <div className="flex flex-col gap-8 p-10">
            {[1, 2].map(i => (
              <div key={i} className={`flex gap-5 animate-pulse ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                <div className="h-12 w-12 shrink-0 rounded-2xl bg-gray-100"></div>
                <div className={`flex flex-col gap-3 ${i % 2 === 0 ? 'items-end' : ''}`}>
                  <div className="h-3 w-32 rounded-full bg-gray-50"></div>
                  <div className={`h-16 w-[280px] md:w-[400px] rounded-2xl bg-gray-100 ${i % 2 === 0 ? 'rounded-tr-none' : 'rounded-tl-none'}`}></div>
                </div>
              </div>
            ))}
          </div>
        ) : thread.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-12 text-center animate-message">
            <div className="h-20 w-20 rounded-3xl bg-purple-50 flex items-center justify-center text-purple-600 mb-6 -rotate-12 transition-smooth hover:rotate-0">
               <Sparkles size={40} />
            </div>
            <div className="text-2xl font-black text-gray-900 tracking-tight">Start a conversation</div>
            <div className="mt-3 max-w-sm text-gray-500 font-medium leading-relaxed">
              Direct messages are private between you and {user.displayName}.
            </div>
            <button 
              onClick={() => handleSend(`Hey ${user.displayName?.split(' ')[0] || 'there'}! 👋`)}
              className="mt-8 bg-[#2c0b2e] text-white px-6 py-3 rounded-2xl font-bold transition-smooth hover:bg-[#1a061b] hover:scale-110 active:scale-95 shadow-lg shadow-[#2c0b2e]/20"
            >
              Say Hi! 👋
            </button>
          </div>
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
            {thread.map((message, index) => {
              const messageDate = new Date(message.sentAt).toLocaleDateString();
              const prevMessageDate = index > 0 ? new Date(thread[index - 1].sentAt).toLocaleDateString() : null;
              const showDateSeparator = messageDate !== prevMessageDate;

              return (
                <React.Fragment key={message.id}>
                  {showDateSeparator && (
                    <div className="flex items-center my-6 px-8 select-none">
                      <div className="flex-1 h-px bg-gray-100"></div>
                      <div className="mx-4 text-[10px] font-black uppercase tracking-wider text-gray-400 bg-white px-4 py-1.5 rounded-full border border-gray-100 shadow-sm">
                        {new Date(message.sentAt).toLocaleDateString(undefined, { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }).includes(new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })) ? 'Today' : 
                         new Date(message.sentAt).toLocaleDateString(undefined, { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }).includes(new Date(Date.now() - 86400000).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })) ? 'Yesterday' : 
                         new Date(message.sentAt).toLocaleDateString(undefined, { 
                          month: 'long', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="flex-1 h-px bg-gray-100"></div>
                    </div>
                  )}
                  <MessageBubble 
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
                    onReact={(emoji) => handleReact(message, emoji)}
                  />
                </React.Fragment>
              );
            })}
          </>
        )}
        <TypingIndicator users={typingUser ? { [typingUser.userId]: typingUser } : {}} />
      <div ref={scrollRef} />
      </div>

      <MessageInput 
        placeholder={`Message ${user.displayName}`} 
        onSendMessage={handleSend} 
        onTyping={handleTyping}
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
