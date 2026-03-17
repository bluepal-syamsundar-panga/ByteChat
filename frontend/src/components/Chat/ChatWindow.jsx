import { Hash, Lock, Pin, Users, MoreVertical, SmilePlus, Pencil, Trash2, LogOut } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { useNavigate } from 'react-router-dom';
import chatService from '../../services/chatService';
import userService from '../../services/userService';
import channelService from '../../services/channelService';
import {
  connectWebSocket,
  publishChannelMessage,
  publishRoomMessage,
  publishTyping,
  subscribeToChannel,
  subscribeToRoom,
  subscribeToTyping,
} from '../../services/websocket';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import notificationService from '../../services/notificationService';
import Modal from '../Shared/Modal';
import ChannelInviteModal from './ChannelInviteModal';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';

const ChatWindow = ({ room, channel }) => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const {
    roomMessages,
    channelMessages,
    onlineUsers,
    typingByWorkspace,
    setRoomMessages,
    setChannelMessages,
    appendRoomMessage,
    appendChannelMessage,
    upsertRoomMessage,
    upsertChannelMessage,
    setTyping,
  } = useChatStore();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState(null);
  
  const scrollRef = useRef(null);
  const messageContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const menuRef = useRef(null);
  const emojiPickerRef = useRef(null);
  
  useEffect(() => {
    if (room && !channel) {
      // If we only have room, fetch channels and pick #general or first one
      console.log('Fetching channels for room:', room.id);
      channelService.getWorkspaceChannels(room.id).then(res => {
         const foundChannels = res.data.data || res.data; // Handle different response structures
         const channelsList = Array.isArray(foundChannels) ? foundChannels : [];
         if (channelsList.length > 0) {
            const general = channelsList.find(c => c.name === 'general') || channelsList[0];
            console.log('Redirecting to channel:', general.id);
            navigate(`/chat/channel/${general.id}`, { replace: true });
         }
      }).catch(err => {
        console.error('Failed to redirect to channel', err);
        // If 403, might be token issue. Let's trace.
        if (err.response?.status === 403) {
          console.warn('403 Forbidden on workspace channels. Checking auth state...');
          console.log('Current token:', useAuthStore.getState().accessToken);
        }
      });
    }
  }, [room, channel, navigate]);

  const roomId = room?.id;
  const channelId = channel?.id;
  const workspaceId = channel?.workspaceId || room?.id;
  const entityId = channelId || roomId;
  const entityType = channelId ? 'channel' : 'room';
  
  const messages = (channelId ? channelMessages[channelId] : roomMessages[roomId]) ?? [];
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
    if (!entityId) {
      return;
    }

    let mounted = true;
    setLoading(true);

    async function loadData() {
      try {
        setMembers([]); // Clear previous members
        if (entityType !== 'channel') {
           setLoading(false);
           return;
        }

        const messagesResponse = await chatService.getChannelMessages(entityId);
        if (!mounted) return;

        // chatService returns response.data (ApiResponse { data: Page<MessageResponse> })
        const messagesData = messagesResponse?.data?.data || messagesResponse?.data || messagesResponse;
        const newMessages = [...(messagesData.content ?? messagesData ?? [])].reverse();
        console.log('Loaded', newMessages.length, 'messages for channel', entityId);
        setChannelMessages(entityId, newMessages);

        // Fetch members separately — failure here must NOT block message display
        try {
          const membersResponse = await userService.getChannelMembers(entityId);
          const membersData = membersResponse?.data?.data || membersResponse?.data || membersResponse;
          const membersList = Array.isArray(membersData) ? membersData : (Array.isArray(membersData?.content) ? membersData.content : []);
          console.log('Loaded', membersList.length, 'members for channel', entityId);
          setMembers(membersList);
        } catch (memberErr) {
          console.warn('Could not load channel members:', memberErr?.response?.status);
          if (channel?.memberCount !== undefined) {
            setMembers(new Array(channel.memberCount).fill({}));
          }
        }

        // Auto-clear notifications
        try {
          await notificationService.markRoomRead(entityId); // Assuming markRoomRead handles both or needs update
          const { setNotifications } = useChatStore.getState();
          setNotifications(prev => prev.map(n => 
            (n.relatedEntityId === entityId) ? { ...n, isRead: true, read: true } : n
          ));
        } catch (e) {
          console.error('Failed to clear notifications', e);
        }

        setTimeout(() => {
          scrollToBottom('auto');
        }, 50);

        connectWebSocket(() => {
          if (entityType === 'channel') {
            subscribeToChannel(entityId, (message) => {
              if (mounted) {
                const container = messageContainerRef.current;
                const isAtBottom = container ? (container.scrollHeight - container.scrollTop <= container.clientHeight + 100) : true;
                appendChannelMessage(entityId, message);
                if (isAtBottom) setTimeout(() => scrollToBottom('smooth'), 50);
              }
            });
          } else {
            subscribeToRoom(entityId, (message) => {
              if (mounted) {
                const container = messageContainerRef.current;
                const isAtBottom = container ? (container.scrollHeight - container.scrollTop <= container.clientHeight + 100) : true;
                appendRoomMessage(entityId, message);
                if (isAtBottom) setTimeout(() => scrollToBottom('smooth'), 50);
              }
            });
          }
          
          if (workspaceId) {
            subscribeToTyping(workspaceId, (event) => {
              setTyping(workspaceId, {
                [event.userId]: event.isTyping ? event.displayName : null,
              });
            });
          }
        });

        // Mark last message as read
        if (newMessages.length > 0) {
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg.senderId !== currentUser.id) {
            chatService.markAsRead(lastMsg.id).catch(err => console.error('Failed to mark as read', err));
          }
        }
      } catch (error) {
        console.error('Failed to load data', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [entityId, entityType, appendChannelMessage, appendRoomMessage, setChannelMessages, setRoomMessages, setTyping]);

  const typingUsers = useMemo(() => {
    const entries = Object.entries(typingByWorkspace[workspaceId] ?? {});
    return entries
      .filter(([userId, name]) => name && Number(userId) !== currentUser?.id)
      .map(([, name]) => name);
  }, [currentUser?.id, workspaceId, typingByWorkspace]);

  async function handleSend(content, file) {
    try {
      let fileUrl = null;
      
      // 1. Upload file if present
      if (file) {
        const resp = await chatService.uploadFile(file);
        fileUrl = resp?.data?.fileUrl || resp?.fileUrl;
      }

      // 2. Send file message if file was uploaded
      if (fileUrl) {
        const filePayload = { content: fileUrl, type: 'FILE' };
        const fileApiResponse = await chatService.sendChannelMessage(entityId, filePayload);
        const sentFileMessage = fileApiResponse?.data ?? fileApiResponse;
        if (sentFileMessage?.id) {
          appendChannelMessage(entityId, sentFileMessage);
        }
      }

      // 3. Send text message if content is present
      if (content && content.trim()) {
        const textPayload = { content, type: 'TEXT' };
        const textApiResponse = await chatService.sendChannelMessage(entityId, textPayload);
        const sentTextMessage = textApiResponse?.data ?? textApiResponse;
        if (sentTextMessage?.id) {
          appendChannelMessage(entityId, sentTextMessage);
        }
      }

      setTimeout(() => scrollToBottom('smooth'), 50);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please check your connection.');
    }
  }

  async function handleEdit(message) {
    const nextContent = window.prompt('Edit message', message.content);
    if (!nextContent || nextContent === message.content) {
      return;
    }

    const apiResponse = await chatService.editMessage(message.id, nextContent);
    // chatService returns ApiResponse; the message is in apiResponse.data
    const updatedMessage = apiResponse?.data ?? apiResponse;
    if (updatedMessage?.id) {
      if (updatedMessage.channelId) {
        upsertChannelMessage(updatedMessage.channelId, updatedMessage);
      } else if (updatedMessage.roomId) {
        upsertRoomMessage(updatedMessage.roomId, updatedMessage);
      } else if (entityType === 'channel') {
        upsertChannelMessage(entityId, updatedMessage);
      } else {
        upsertRoomMessage(entityId, updatedMessage);
      }
    }
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
    const deletedMsg = {
      ...message,
      content: 'This message was deleted.',
      isDeleted: true,
    };
    if (entityType === 'channel') {
      upsertChannelMessage(entityId, deletedMsg);
    } else {
      upsertRoomMessage(entityId, deletedMsg);
    }
  }

  const handlePin = async (message) => {
    const apiResponse = await chatService.pinMessage(message.id);
    const updatedMessage = apiResponse?.data ?? apiResponse;
    if (updatedMessage?.id) {
      if (updatedMessage.channelId) {
        upsertChannelMessage(updatedMessage.channelId, updatedMessage);
      } else if (updatedMessage.roomId) {
        upsertRoomMessage(updatedMessage.roomId, updatedMessage);
      } else if (entityType === 'channel') {
        upsertChannelMessage(entityId, updatedMessage);
      } else {
        upsertRoomMessage(entityId, updatedMessage);
      }
    }
  };

  const handleArchive = async () => {
    if (!window.confirm(`Are you sure you want to archive #${channel?.name}?`)) return;
    try {
      await channelService.archiveChannel(channelId);
      window.alert('Channel archived successfully');
      window.location.reload();
    } catch (e) {
      window.alert('Failed to archive channel');
    }
  };

  const handleLeaveChannel = async () => {
    if (!channel) return;
    
    // Check if creator
    const isCreator = channel.createdBy?.id === currentUser?.id || channel.isCreator;
    
    if (isCreator && members.length > 1) {
      if (window.confirm('As the creator, you must transfer ownership before leaving. Open transfer menu?')) {
        setShowTransferModal(true);
      }
      return;
    }

    if (!window.confirm(`Are you sure you want to leave #${channel?.name}?`)) return;
    try {
      await channelService.leaveChannel(channelId);
      navigate(`/chat/workspace/${workspaceId}`);
    } catch (error) {
      console.error('Failed to leave channel:', error);
      alert(error.response?.data?.message || 'Failed to leave channel.');
    }
  };

  const handleTransferOwnership = async () => {
    if (!newOwnerId) return;
    try {
      await channelService.transferOwnership(channelId, newOwnerId);
      alert('Ownership transferred successfully. You can now leave the channel.');
      setShowTransferModal(false);
      // Optional: immediately leave after transfer? User suggested "then he can leave"
      if (window.confirm('Ownership transferred. Leave channel now?')) {
        await channelService.leaveChannel(channelId);
        navigate(`/chat/workspace/${workspaceId}`);
      }
    } catch (error) {
      alert('Failed to transfer ownership.');
    }
  };

  const handleDeleteChannel = async () => {
    if (!window.confirm(`Move #${channel?.name} to Trash? You can restore it later from the Trash Bin.`)) return;
    try {
      await channelService.deleteChannel(channelId);
      alert('Channel moved to trash.');
      navigate(`/chat/workspace/${workspaceId}`);
    } catch (error) {
      console.error('Failed to delete channel:', error);
      alert(error.response?.data?.message || 'Only the creator or workspace owner can delete this channel.');
    }
  };

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
    
    if (entityType === 'channel') {
      upsertChannelMessage(entityId, updatedMessage);
    } else {
      upsertRoomMessage(entityId, updatedMessage);
    }
    
    try {
      await chatService.reactToMessage(message.id, emoji);
    } catch (e) {
      console.error('Failed to react', e);
      if (entityType === 'channel') {
        upsertChannelMessage(entityId, message);
      } else {
        upsertRoomMessage(entityId, message);
      }
    }
  }

  const pinnedMessages = useMemo(() => 
    messages.filter(m => m.isPinned),
    [messages]
  );

  function handleTyping(isTyping) {
    if (!workspaceId) return;
    publishTyping(workspaceId, {
      userId: currentUser?.id,
      displayName: currentUser?.displayName,
      isTyping,
    });

    window.clearTimeout(typingTimeoutRef.current);
    if (isTyping) {
      typingTimeoutRef.current = window.setTimeout(() => {
        publishTyping(workspaceId, {
          userId: currentUser?.id,
          displayName: currentUser?.displayName,
          isTyping: false,
        });
      }, 1800);
    }
  }

  if (!entityId) {
    return (
      <EmptyState
        title="Select a channel or workspace"
        description="Choose a workspace from the home page and then a channel from the sidebar."
      />
    );
  }

  const name = channel?.name || room?.name;
  const description = channel?.description || room?.description;

  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="flex items-center justify-between border-b border-black/5 px-5 py-4">
        {/* Transfer Ownership Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white p-8 border border-black/10 shadow-2xl rounded-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#1d1c1d]">Transfer Ownership</h2>
                <button onClick={() => setShowTransferModal(false)} className="text-[#6b6a6b] hover:text-black">
                  <X size={24} />
                </button>
              </div>
              <p className="text-sm text-[#6b6a6b] mb-4">
                Select a member to become the new owner of <strong>#{channel?.name}</strong> before you leave.
              </p>
              <div className="max-h-60 overflow-y-auto border border-black/10 rounded mb-4">
                {members.filter(m => m.id !== currentUser?.id).map(member => (
                  <button
                    key={member.id}
                    onClick={() => setNewOwnerId(member.id)}
                    className={`flex w-full items-center gap-3 p-3 transition hover:bg-black/5 ${newOwnerId === member.id ? 'bg-black/5 border-l-4 border-[#3f0e40]' : 'border-l-4 border-transparent'}`}
                  >
                    <div className="h-8 w-8 rounded bg-[#3f0e40] flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {member.displayName?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-semibold text-[#1d1c1d]">{member.displayName}</div>
                      <div className="text-xs text-[#6b6a6b]">{member.email}</div>
                    </div>
                    {newOwnerId === member.id && <Check size={16} className="text-[#3f0e40]" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 px-4 py-2 border border-black/10 rounded text-[#1d1c1d] hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransferOwnership}
                  disabled={!newOwnerId}
                  className="flex-1 px-4 py-2 bg-[#3f0e40] text-white rounded font-semibold hover:bg-[#350d36] disabled:opacity-50"
                >
                  Transfer & Leave
                </button>
              </div>
            </div>
          </div>
        )}
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold">
            {(channel?.isPrivate || channel?.private) ? (
              <Lock size={18} className="text-[#6b6a6b]" />
            ) : (
              <Hash size={18} className="text-[#6b6a6b]" />
            )}
            {name}
          </div>
          <div className="mt-1 text-sm text-[#6b6a6b]">
            {description || `Real-time ${entityType} conversation`}
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
            {members.length} members
          </div>
          
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`p-1.5 border border-black/5 transition flex items-center justify-center ${
                showMenu ? 'bg-black/10 text-black' : 'hover:bg-black/5 text-[#6b6a6b] cursor-pointer'
              }`}
            >
              <MoreVertical size={20} />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 border border-black/10 bg-white shadow-xl z-50 py-1 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                
                {/* --- MESSAGE OPTIONS --- */}
                {selectedMessage ? (
                  <>
                    <div className="px-4 py-2 border-b border-black/5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#6b6a6b] mb-2">Reactions</div>
                      <div className="flex items-center justify-between">
                        {['👍', '❤️', '😂', '😮', '😢', '🔥'].map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => {
                              handleReact(selectedMessage, emoji);
                              setShowMenu(false);
                              setSelectedMessageId(null);
                            }}
                            className="bg-black/5 hover:bg-black/10 w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-110"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative" ref={emojiPickerRef}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowEmojiPicker(!showEmojiPicker);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[#1d1c1d] transition hover:bg-black/5"
                      >
                        <SmilePlus size={16} className="text-[#6b6a6b]" /> More Reactions
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
                  </>
                ) : (
                  /* --- CHANNEL OPTIONS --- */
                  <>
                    <div className="px-4 py-1.5 border-b border-black/5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#6b6a6b]">Channel Management</div>
                    </div>
                    
                    {!channel?.isArchived && (
                      <button 
                        onClick={() => {
                          handleArchive();
                          setShowMenu(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[#1d1c1d] transition hover:bg-black/5"
                      >
                        <Trash2 size={16} className="text-[#6b6a6b]" /> Archive Channel
                      </button>
                    )}

                    <button 
                      onClick={() => {
                        handleLeaveChannel();
                        setShowMenu(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[#1d1c1d] transition hover:bg-black/5"
                    >
                      <LogOut size={16} className="text-[#6b6a6b]" /> Leave Channel
                    </button>

                    <button 
                      onClick={() => {
                        handleDeleteChannel();
                        setShowMenu(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[#e01e5a] transition hover:bg-[#e01e5a]/10"
                    >
                      <Trash2 size={16} className="text-[#e01e5a]" /> Delete Channel
                    </button>
                  </>
                )}

                <button 
                  onClick={() => {
                    setShowInviteModal(true);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[#1d1c1d] transition hover:bg-black/5 lg:hidden border-t border-black/5"
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
          <div className="sticky top-0 z-10 flex items-center justify-between bg-white/80 backdrop-blur-sm px-5 py-3 border-b border-black/5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff7d6] text-[#8c5b00]">
                <Pin size={16} />
              </div>
              <div>
                <div className="text-sm font-bold text-[#1d1c1d]">
                  {pinnedMessages.length} pinned {pinnedMessages.length === 1 ? 'message' : 'messages'}
                </div>
                <div className="text-xs text-[#6b6a6b]">Visible to everyone in this channel</div>
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
        placeholder={channel?.isArchived ? "This channel is archived" : `Message #${name}`}
        onSendMessage={handleSend}
        onTyping={handleTyping}
        disabled={channel?.isArchived}
        mentionSuggestions={members}
        currentUserId={currentUser.id}
      />
      <ChannelInviteModal 
        isOpen={showInviteModal} 
        onClose={() => setShowInviteModal(false)}
        channelId={channelId}
        workspaceId={workspaceId}
        channelName={name}
      />
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
