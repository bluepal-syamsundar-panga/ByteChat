import { Hash, Lock, Pin, Users, MoreVertical, SmilePlus, Pencil, Trash2, LogOut, MessageSquareShare } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import TypingIndicator from './TypingIndicator';
import Modal from '../Shared/Modal';
import useToastStore from '../../store/toastStore';
import ChannelInviteModal from './ChannelInviteModal';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import ChannelInfoDrawer from './ChannelInfoDrawer';
import { Check } from 'lucide-react';

const ChatWindow = ({ room, channel }) => {
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);
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
    upsertChannelMessage,
    setTyping,
    setActiveThread,
    clearChannelUnread,
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
  const [showMembersList, setShowMembersList] = useState(false);
  const [showChannelInfo, setShowChannelInfo] = useState(false);
  
  const scrollRef = useRef(null);
  const messageContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const menuRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showArchiveConfirmModal, setShowArchiveConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  
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
              // Store the full event object to include avatar and displayName
              setTyping(workspaceId, {
                [event.userId]: event.isTyping ? event : null,
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

    if (entityId) {
      setActiveThread({ type: entityType, id: entityId });
      if (entityType === 'channel') {
        clearChannelUnread(entityId);
        chatService.markChannelAsRead(entityId).catch(err => console.error('Failed to mark channel as read', err));
      }
    }

    loadData();

    return () => {
      mounted = false;
      setActiveThread(null);
    };
  }, [entityId, entityType, appendChannelMessage, appendRoomMessage, setChannelMessages, setRoomMessages, setTyping, setActiveThread, clearChannelUnread]);

  const typingUsers = useMemo(() => {
    const entries = Object.entries(typingByWorkspace[workspaceId] ?? {});
    // Filter out historical nulls and current user, return the typing event objects
    const active = {};
    entries.forEach(([userId, data]) => {
      if (data && data.isTyping && Number(userId) !== currentUser?.id) {
        // Filter by channel if applicable
        if (!channelId || !data.channelId || data.channelId === channelId) {
           active[userId] = data;
        }
      }
    });
    return active;
  }, [currentUser?.id, workspaceId, typingByWorkspace, channelId]);

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
      addToast('Failed to send message.', 'error');
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
      addToast('Invite sent', 'success');
      setShowInviteModal(false);
      setInviteEmail('');
    } catch (error) {
      addToast(error.response?.data?.message ?? 'Unable to send invite', 'error');
    }
  }

  async function handleDelete(message) {
    setDeleteTarget(message);
    setShowDeleteConfirmModal(true);
  }

  const confirmDeleteMessage = async () => {
    if (!deleteTarget) return;
    const message = deleteTarget;
    try {
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
      addToast('Message deleted', 'success');
    } catch (error) {
      addToast('Failed to delete message', 'error');
    } finally {
      setShowDeleteConfirmModal(false);
      setDeleteTarget(null);
    }
  };

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
    setShowArchiveConfirmModal(true);
  };

  const confirmArchive = async () => {
    try {
      await channelService.archiveChannel(channelId);
      // Update store so sidebar reflects change immediately
      const { channels, setChannels } = useChatStore.getState();
      setChannels(channels.map(c => c.id === channelId ? { ...c, isArchived: true } : c));
      
      setShowArchiveConfirmModal(false);
      addToast('Channel archived successfuly', 'success');
      navigate(`/chat/workspace/${workspaceId}`);
    } catch (e) {
      console.error('Failed to archive channel', e);
      addToast('Failed to archive channel', 'error');
    }
  };

  const handleLeaveChannel = async () => {
    if (!channel) return;
    
    // Check if user is ADMIN in this channel
    const isAdmin = channel.role === 'ADMIN';
    const isOnlyMember = members.length === 1;

    if (isAdmin && !isOnlyMember) {
      // If Admin and not only member, forced transfer
      setNewOwnerId(null);
      setShowTransferModal(true);
      return;
    }

    setShowLeaveModal(true);
  };

  const confirmLeaveChannel = async () => {
    try {
      await channelService.leaveChannel(channelId);
      setShowLeaveModal(false);
      navigate(`/chat/workspace/${workspaceId}`);
    } catch (error) {
      console.error('Failed to leave channel:', error);
      addToast(error.response?.data?.message || 'Failed to leave channel.', 'error');
    }
  };

  const handleTransferOwnership = async () => {
    if (!newOwnerId) return;
    try {
      await channelService.transferOwnership(channelId, newOwnerId);
      await channelService.leaveChannel(channelId);
      setShowTransferModal(false);
      addToast('Ownership transferred and channel left', 'success');
      navigate(`/chat/workspace/${workspaceId}`);
    } catch (error) {
      console.error('Failed to transfer and leave:', error);
      addToast(error.response?.data?.message || 'Failed to transfer ownership.', 'error');
    }
  };

  const handleDeleteChannel = async () => {
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteChannel = async () => {
    try {
      await channelService.deleteChannel(channelId);
      // Update store
      const { channels, setChannels } = useChatStore.getState();
      setChannels(channels.map(c => c.id === channelId ? { ...c, isDeleted: true } : c));
      
      setShowDeleteConfirmModal(false);
      addToast('Channel moved to trash', 'success');
      navigate(`/chat/workspace/${workspaceId}`);
    } catch (error) {
      console.error('Failed to delete channel:', error);
      addToast(error.response?.data?.message || 'Only the creator or workspace owner can delete this channel.', 'error');
    }
  };

  async function handleReact(message, emoji) {
    if (!emoji) {
      return;
    }
    
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
    
    if (entityType === 'channel') {
      upsertChannelMessage(entityId, updatedMessage);
    } else {
      upsertRoomMessage(entityId, updatedMessage);
    }
    
    try {
      const response = await chatService.reactToMessage(message.id, emoji);
      const serverMessage = response.data || response;
      if (entityType === 'channel') {
        upsertChannelMessage(entityId, serverMessage);
      } else {
        upsertRoomMessage(entityId, serverMessage);
      }
      setSelectedMessageId(null);
      setShowMenu(false);
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
      avatar: currentUser?.avatarUrl,
      isTyping,
      channelId
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
    <section className="flex h-full min-h-0 flex-col bg-white overflow-hidden">
      <header className="flex items-center justify-between border-b border-gray-100 px-8 py-2.5 bg-white/50 backdrop-blur-md sticky top-0 z-20 transition-all duration-300">
        {loading && (
          <div className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-100 overflow-hidden">
            <div className="h-full bg-indigo-500 skeleton-loading" style={{ width: '40%' }}></div>
          </div>
        )}
        {/* Transfer Ownership Modal */}
        <Modal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          title="Transfer Channel Admin"
          rounded="rounded-none"
        >
          <div className="p-1">
            <p className="text-sm text-[#6b6a6b] mb-6">
              As the only admin, you must transfer your admin role to another member before you can leave <strong>#{channel?.name}</strong>.
            </p>
            <div className="max-h-60 overflow-y-auto border border-black/5 rounded-xl mb-6 scrollbar-thin">
              {members.filter(m => m.id !== currentUser?.id).map(member => (
                <button
                  key={member.id}
                  onClick={() => setNewOwnerId(member.id)}
                  className={`flex w-full items-center gap-3 p-3 transition-all hover:bg-black/5 ${newOwnerId === member.id ? 'bg-[#3f0e40]/5 border-l-4 border-[#3f0e40]' : 'border-l-4 border-transparent'}`}
                >
                  <div className="h-10 w-10 rounded-full bg-[#3f0e40] flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                    {member.displayName?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-bold text-[#1d1c1d]">{member.displayName}</div>
                    <div className="text-[10px] text-gray-400 font-bold">{member.email}</div>
                  </div>
                  {newOwnerId === member.id && (
                    <div className="h-5 w-5 rounded-full bg-[#3f0e40] flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
              {members.filter(m => m.id !== currentUser?.id).length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No other members in this channel.
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowTransferModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-[#1d1c1d] font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTransferOwnership}
                disabled={!newOwnerId}
                className="flex-1 px-4 py-2.5 bg-[#3f0e40] text-white rounded-xl font-bold text-sm hover:bg-[#350d36] disabled:opacity-50 transition-all shadow-md active:scale-95"
              >
                Transfer & Leave
              </button>
            </div>
          </div>
        </Modal>

        {/* Generic Leave Confirmation Modal */}
        <Modal
          isOpen={showLeaveModal}
          onClose={() => setShowLeaveModal(false)}
          title="Leave Channel"
          rounded="rounded-none"
        >
          <div className="p-1">
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Are you sure you want to leave <strong>#{channel?.name}</strong>? 
              {channel?.isPrivate ? " Since this is a private channel, you'll need an invite to join again." : " You can rejoin this public channel anytime."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                Keep Channel
              </button>
              <button
                onClick={confirmLeaveChannel}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-md active:scale-95"
              >
                Leave Channel
              </button>
            </div>
          </div>
        </Modal>

        {/* Delete Message Confirmation Modal */}
        <Modal
          isOpen={showDeleteConfirmModal}
          onClose={() => setShowDeleteConfirmModal(false)}
          title="Delete Message"
          rounded="rounded-none"
        >
          <div className="p-1">
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-none text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteMessage}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-none font-bold text-sm hover:bg-red-700 transition-all shadow-md active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>

          <div 
            className="flex items-center gap-3 cursor-pointer group/title select-none"
            onClick={() => setShowChannelInfo(true)}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${(channel?.isPrivate || channel?.private) ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'} transition-smooth group-hover/title:scale-110`}>
              {(channel?.isPrivate || channel?.private) ? (
                <Lock size={16} />
              ) : (
                <Hash size={16} />
              )}
            </div>
            <div>
              <div className="text-[17px] font-black tracking-tight text-gray-900 leading-none group-hover/title:text-[#3f0e40] transition-colors">
                {name}
              </div>
              <div className="mt-1 text-[10px] font-bold text-[#3f0e40] animate-in fade-in slide-in-from-left-2 duration-300">
                {members.length} members • Click for info
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="hidden sm:flex items-center gap-2 bg-[#3f0e40] text-white px-5 py-1 !rounded-none font-bold text-sm transition-smooth hover:bg-[#350d36] hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-purple-900/10 h-7"
          >
            <Users size={16} />
            <span>Invite</span>
          </button>
          
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`h-9 w-9 rounded-lg transition-smooth flex items-center justify-center ${
                showMenu ? 'bg-black/5 text-gray-900' : 'text-gray-400 hover:text-gray-900 hover:bg-black/5'
              }`}
            >
              <MoreVertical size={20} />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-2xl shadow-2xl z-50 py-2 border border-black/5 animate-in fade-in slide-in-from-top-4 duration-300 origin-top-right">
                
                {selectedMessage ? (
                  /* --- MESSAGE OPTIONS --- */
                  <>
                    <div className="px-4 py-1.5 border-b border-black/5">
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
                        title="Archive this channel only for yourself"
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

                    {(channel?.role === 'ADMIN' || currentUser?.id === room?.ownerId) && (
                      <button 
                        onClick={() => {
                          handleDeleteChannel();
                          setShowMenu(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[#e01e5a] transition hover:bg-[#e01e5a]/10"
                      >
                        <Trash2 size={16} className="text-[#e01e5a]" /> Delete Channel
                      </button>
                    )}
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

      <ChannelInfoDrawer 
        isOpen={showChannelInfo}
        onClose={() => setShowChannelInfo(false)}
        channel={channel}
        members={members}
        isWorkspaceOwner={room?.ownerId === currentUser?.id}
        onMemberRemoved={(userId) => {
          setMembers(prev => prev.filter(m => m.id !== userId));
        }}
      />

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
          <div className="flex flex-col gap-8 p-10">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`flex gap-5 animate-pulse ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                <div className="h-12 w-12 shrink-0 rounded-2xl bg-gray-100"></div>
                <div className={`flex flex-col gap-3 ${i % 2 === 0 ? 'items-end' : ''}`}>
                  <div className="h-3 w-32 rounded-full bg-gray-50"></div>
                  <div className={`h-16 w-[280px] md:w-[400px] rounded-2xl bg-gray-100 ${i % 2 === 0 ? 'rounded-tr-none' : 'rounded-tl-none'}`}></div>
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-12 text-center animate-message">
            <div className="h-20 w-20 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-6 rotate-12 transition-smooth hover:rotate-0">
              <MessageSquareShare size={40} />
            </div>
            <div className="text-2xl font-black text-gray-900 tracking-tight">No messages yet</div>
            <div className="mt-3 max-w-sm text-gray-500 font-medium leading-relaxed">
              Start the conversation with a welcome note or a friendly wave.
            </div>
            <button 
              onClick={() => handleSend(`Hey ${currentUser?.displayName?.split(' ')[0] || 'there'}! 👋`)}
              className="mt-8 bg-[#2c0b2d] text-white px-6 py-3 rounded-2xl font-bold transition-smooth hover:bg-[#1a061b] hover:scale-110 active:scale-95 shadow-lg shadow-[#2c0b2e]/20"
            >
              Say Hello! 👋
            </button>
          </div>
        ) : (
          messages.map((message, index) => {
            const messageDate = new Date(message.sentAt).toLocaleDateString();
            const prevMessageDate = index > 0 ? new Date(messages[index - 1].sentAt).toLocaleDateString() : null;
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
                      setShowEmojiPicker(false);
                    } else {
                      setSelectedMessageId(message.id);
                      setShowMenu(false);
                      setShowEmojiPicker(false);
                    }
                  }}
                  onReact={(emoji) => handleReact(message, emoji)}
                />
              </React.Fragment>
            );
          })
        )}
        <TypingIndicator users={typingUsers} />
        <div ref={scrollRef} />
      </div>

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

      {/* Confirmation Modals for Archive and Delete */}
      <Modal
        isOpen={showArchiveConfirmModal}
        onClose={() => setShowArchiveConfirmModal(false)}
        title="Archive Channel"
      >
        <div className="p-1">
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Are you sure you want to archive <strong>#{channel?.name}</strong>? 
            Archiving will move it to your personal archive. You can still view it in the Archived Channels view.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowArchiveConfirmModal(false)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmArchive}
              className="flex-1 px-4 py-2.5 bg-[#3f0e40] text-white rounded-xl font-bold text-sm hover:bg-[#350d36] transition-all shadow-md active:scale-95"
            >
              Archive Channel
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirmModal}
        onClose={() => setShowDeleteConfirmModal(false)}
        title="Move to Trash"
      >
        <div className="p-1">
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Move <strong>#{channel?.name}</strong> to Trash? 
            This channel will be hidden for everyone, but can be restored by the workspace owner or creator from the Trash Bin.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirmModal(false)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteChannel}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-md active:scale-95"
            >
              Move to Trash
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
  </div>
);

export default ChatWindow;
