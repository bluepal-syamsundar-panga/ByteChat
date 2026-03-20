import { MessageSquareShare, Sparkles, MoreVertical, SmilePlus, Pencil, Trash2, Pin, Paperclip, X, Users2, Reply } from 'lucide-react';
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
import Modal from '../Shared/Modal';
import useToastStore from '../../store/toastStore';

const DMChatWindow = ({ user }) => {
  const currentUser = useAuthStore((state) => state.user);
  const { dmMessages, setDmMessages, appendDmMessage, upsertDmMessage, removeDmMessage, sharedUsers, setActiveThread, clearDmUnread } = useChatStore();
  const [loading, setLoading] = useState(true);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { addToast } = useToastStore();
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [showPinnedDetails, setShowPinnedDetails] = useState(false);
  
  const scrollRef = useRef(null);
  const messageContainerRef = useRef(null);
  const menuRef = useRef(null);
  const emojiPickerRef = useRef(null);
  
  const thread = dmMessages[user?.id] ?? [];
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);
  const remoteTypingTimeoutRef = useRef(null);
  const hadTypingUserRef = useRef(false);

  const selectedMessage = useMemo(() => {
    const match = thread.find(m => m.id === selectedMessageId);
    return match && !match.isDeleted ? match : null;
  }, [thread, selectedMessageId]);

  const pinnedMessages = useMemo(() => 
    thread.filter(m => m.isPinned),
    [thread]
  );
  const latestPinnedMessage = pinnedMessages[pinnedMessages.length - 1] ?? null;
  const additionalPinnedMessages = useMemo(
    () => pinnedMessages.filter((message) => message.id !== latestPinnedMessage?.id),
    [pinnedMessages, latestPinnedMessage?.id]
  );

  useEffect(() => {
    if (!selectedMessageId) return;
    const current = thread.find((m) => m.id === selectedMessageId);
    if (!current || current.isDeleted) {
      setSelectedMessageId(null);
      setShowMenu(false);
    }
  }, [thread, selectedMessageId]);

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
        const isTyping = data?.isTyping ?? data?.typing ?? false;

        if (data.targetUserId === currentUser.id && data.userId === user.id) {
          clearTimeout(remoteTypingTimeoutRef.current);

          if (isTyping) {
            setTypingUser({ ...data, isTyping: true });
            remoteTypingTimeoutRef.current = setTimeout(() => setTypingUser(null), 1000);
          } else {
            remoteTypingTimeoutRef.current = setTimeout(() => setTypingUser(null), 1000);
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
      clearTimeout(remoteTypingTimeoutRef.current);
      setActiveThread(null);
    };
  }, [setDmMessages, appendDmMessage, user?.id, currentUser?.id, setActiveThread, clearDmUnread]);

  async function handleSend(content, file) {
    try {
      let fileUrl = null;
      let fileMessageType = 'FILE';
      
      // 1. Upload file if present (using chatService as it has the upload logic)
      if (file) {
        const resp = await chatService.uploadFile(file);
        const attachment = resp?.data ?? resp;
        fileUrl = attachment?.fileUrl ?? attachment?.url ?? null;
        if (file.type?.startsWith('image/')) {
          fileMessageType = 'FILE';
        } else if (file.type?.startsWith('video/')) {
          fileMessageType = 'VIDEO';
        } else if (file.type?.startsWith('audio/')) {
          fileMessageType = 'AUDIO';
        } else {
          fileMessageType = 'DOCUMENT';
        }
      }

      // 2. Send file message if file was uploaded
      if (fileUrl) {
        const fileApiResponse = await dmService.sendDirectMessage(user.id, { content: fileUrl, type: fileMessageType, replyToMessageId: replyTarget?.id ?? null });
        const sentFileMessage = fileApiResponse?.data ?? fileApiResponse;
        if (sentFileMessage?.id) {
          appendDmMessage(user.id, sentFileMessage);
        }
      }

      // 3. Send text message if content is present
      if (content && content.trim()) {
        const textApiResponse = await dmService.sendDirectMessage(user.id, { content, type: 'TEXT', replyToMessageId: replyTarget?.id ?? null });
        const sentTextMessage = textApiResponse?.data ?? textApiResponse;
        if (sentTextMessage?.id) {
          appendDmMessage(user.id, sentTextMessage);
        }
      }

      setTimeout(() => scrollToBottom('smooth'), 50);
      setReplyTarget(null);
    } catch (error) {
      console.error('Failed to send DM:', error);
      addToast('Failed to send message. Please try again.', 'error');
    }
  }

  async function handleEdit(message) {
    setEditTarget(message);
    setEditContent(message.content);
  }

  const cancelEdit = () => {
    setEditTarget(null);
    setEditContent('');
  };

  const cancelReply = () => {
    setReplyTarget(null);
  };

  const confirmEditMessage = async (content) => {
    if (!editTarget || !content.trim() || content === editTarget.content) {
      cancelEdit();
      return;
    }

    try {
      const response = await dmService.editMessage(editTarget.id, content.trim());
      upsertDmMessage(user.id, response.data || response);
      addToast('Message updated', 'success');
    } catch (err) {
      console.error('Failed to edit DM', err);
      addToast('Failed to edit message', 'error');
    } finally {
      cancelEdit();
    }
  };

  async function handleDelete(message) {
    setDeleteTarget(message);
    setShowDeleteConfirmModal(true);
  }

  const confirmDeleteMessage = async (scope = 'everyone') => {
    if (!deleteTarget) return;
    try {
      const response = await dmService.deleteMessage(deleteTarget.id, scope);
      if (scope === 'self') {
        removeDmMessage(user.id, deleteTarget.id);
        addToast('Message removed from your view', 'success');
      } else {
        upsertDmMessage(user.id, response.data || response);
        addToast('Message deleted', 'success');
      }
    } catch (err) {
      console.error('Failed to delete DM', err);
      addToast('Failed to delete message', 'error');
    } finally {
      setShowDeleteConfirmModal(false);
      setDeleteTarget(null);
    }
  };

  async function handlePin(message) {
    try {
      const response = await dmService.pinMessage(message.id);
      upsertDmMessage(user.id, response.data || response);
      const updatedMessage = response.data || response;
      addToast(updatedMessage?.isPinned ? 'Message pinned' : 'Message unpinned', 'success');
    } catch (err) {
      console.error('Failed to pin DM', err);
      addToast('Failed to update pin', 'error');
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
    window.clearTimeout(typingTimeoutRef.current);

    publishTyping('direct', {
      userId: currentUser.id,
      displayName: currentUser.displayName,
      avatar: currentUser.avatarUrl,
      isTyping,
      targetUserId: user.id
    });

    if (isTyping) {
      typingTimeoutRef.current = window.setTimeout(() => {
        publishTyping('direct', {
          userId: currentUser.id,
          displayName: currentUser.displayName,
          avatar: currentUser.avatarUrl,
          isTyping: false,
          targetUserId: user.id,
        });
      }, 900);
    }
  }

  useEffect(() => () => {
    window.clearTimeout(typingTimeoutRef.current);
    if (currentUser?.id && user?.id) {
      publishTyping('direct', {
        userId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatarUrl,
        isTyping: false,
        targetUserId: user.id,
      });
    }
  }, [currentUser?.id, currentUser?.displayName, currentUser?.avatarUrl, user?.id]);

  useEffect(() => {
    const hasTypingUser = Boolean(typingUser);
    if (hasTypingUser && !hadTypingUserRef.current) {
      setTimeout(() => scrollToBottom('smooth'), 50);
    }
    hadTypingUserRef.current = hasTypingUser;
  }, [typingUser]);

  if (!user) {
    return <EmptyState title="Select a direct message" description="Open a teammate from the DM list to start chatting." />;
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-white overflow-hidden">
      <header className="flex items-center justify-between px-8 py-2.5 bg-white/50 backdrop-blur-md sticky top-0 z-20">
        {loading && (
          <div className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-100 overflow-hidden">
            <div className="h-full bg-indigo-500 skeleton-loading" style={{ width: '40%' }}></div>
          </div>
        )}
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#611f69] to-[#3f0e40] text-white font-extrabold text-lg shadow-md shadow-purple-900/10 overflow-hidden">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
            ) : (
              user.displayName?.[0]?.toUpperCase() ?? 'U'
            )}
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
                <button 
                  onClick={() => {
                    setReplyTarget(selectedMessage);
                    setShowMenu(false);
                    setSelectedMessageId(null);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[#1d1c1d] transition hover:bg-black/5"
                >
                  <Reply size={16} className="text-[#6b6a6b]" />
                  Reply
                </button>

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

      {latestPinnedMessage && (
        <div className="sticky top-0 z-10 bg-gradient-to-b from-white via-[#fffbea] to-transparent px-4 pt-3 md:px-8">
          <div className="mx-auto w-full max-w-6xl rounded-2xl border border-[#f2e7b5] bg-[#fffbea] px-3 py-2.5">
            <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSelectedMessageId(latestPinnedMessage.id);
                setShowMenu(false);
              }}
              className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff3bf] text-[#8c5b00]"
              title={latestPinnedMessage.pinnedByName ? `Pinned by ${latestPinnedMessage.pinnedByName}` : 'Pinned'}
            >
              <Pin size={14} />
              {!showPinnedDetails && pinnedMessages.length > 1 && (
                <span className="absolute -top-1 -right-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#8c5b00] px-1 text-[9px] font-bold text-white">
                  {pinnedMessages.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                if (additionalPinnedMessages.length > 0) {
                  setShowPinnedDetails((prev) => !prev);
                  return;
                }
                setSelectedMessageId(latestPinnedMessage.id);
                setShowMenu(false);
              }}
              className="min-w-0 flex-1 text-left"
              title={latestPinnedMessage.pinnedByName ? `Pinned by ${latestPinnedMessage.pinnedByName}` : 'Pinned'}
            >
              <p className="truncate text-sm text-[#4b4a4b]">
                {latestPinnedMessage.content?.trim() || 'Pinned attachment'}
              </p>
            </button>
            <button
              type="button"
              onClick={() => handlePin(latestPinnedMessage)}
              className="rounded-full p-1.5 text-[#8c5b00] transition hover:bg-[#fff3bf]"
              title="Unpin message"
            >
              <X size={14} />
            </button>
          </div>
            {showPinnedDetails && additionalPinnedMessages.length > 0 && (
              <div className="mt-3 space-y-2 border-t border-[#f2e7b5] pt-3">
                {additionalPinnedMessages.map((message) => (
                  <div
                    key={message.id}
                    className="flex items-start gap-3 rounded-xl border border-gray-100 px-3 py-2"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMessageId(message.id);
                        setShowPinnedDetails(false);
                        setShowMenu(false);
                      }}
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff3bf] text-[#8c5b00]"
                      title={message.pinnedByName ? `Pinned by ${message.pinnedByName}` : 'Pinned'}
                    >
                      <Pin size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMessageId(message.id);
                        setShowPinnedDetails(false);
                        setShowMenu(false);
                      }}
                      className="min-w-0 flex-1 text-left"
                      title={message.pinnedByName ? `Pinned by ${message.pinnedByName}` : 'Pinned'}
                    >
                      <span className="block truncate text-sm font-bold text-[#1d1c1d]">
                        {message.content?.trim() || 'Pinned attachment'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePin(message)}
                      className="rounded-full p-2 text-[#8c5b00] transition hover:bg-[#fff3bf]"
                      title={message.pinnedByName ? `Unpin message pinned by ${message.pinnedByName}` : 'Unpin message'}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
                    isSelected={!message.isDeleted && selectedMessageId === message.id}
                    onClick={() => {
                      if (message.isDeleted) {
                        setSelectedMessageId(null);
                        setShowMenu(false);
                        return;
                      }
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
        onSendMessage={editTarget ? confirmEditMessage : handleSend} 
        onTyping={handleTyping}
        mentionSuggestions={[user]}
        currentUserId={currentUser.id}
        editMode={Boolean(editTarget)}
        editValue={editContent}
        onCancelEdit={cancelEdit}
        editLabel={editTarget?.content}
        submitLabel="Save"
        replyTarget={replyTarget}
        onCancelReply={cancelReply}
      />

      {/* Delete Message Confirmation */}
      <Modal
        isOpen={showDeleteConfirmModal}
        onClose={() => setShowDeleteConfirmModal(false)}
        title="Delete message?"
        rounded="rounded-none"
      >
        <div className="p-1">
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Choose how you want to delete this message.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => confirmDeleteMessage('self')}
              className="w-full px-4 py-3 border border-gray-200 rounded-none text-left text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Delete from me
            </button>
            {deleteTarget?.senderId === currentUser?.id && (
              <button
                onClick={() => confirmDeleteMessage('everyone')}
                className="w-full px-4 py-3 bg-red-600 text-left text-white rounded-none font-bold text-sm hover:bg-red-700 transition-all shadow-md active:scale-95"
              >
                Delete from everyone
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirmModal(false)}
              className="w-full px-4 py-3 border border-gray-200 rounded-none text-left text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
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
