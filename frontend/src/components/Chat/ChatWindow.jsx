import { Hash, Lock, Pin, Users, MoreVertical, SmilePlus, Pencil, Trash2, LogOut, MessageSquareShare, Reply, X, Video } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { useNavigate } from 'react-router-dom';
import chatService from '../../services/chatService';
import userService from '../../services/userService';
import channelService from '../../services/channelService';
import workspaceService from '../../services/workspaceService';
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
    channels,
    sidebarChannels,
    workspaces,
    onlineUsers,
    typingByWorkspace,
    setRoomMessages,
    setChannelMessages,
    prependChannelMessages,
    appendRoomMessage,
    appendChannelMessage,
    upsertChannelMessage,
    upsertRoomMessage,
    removeChannelMessage,
    removeRoomMessage,
    setTyping,
    setActiveThread,
    clearChannelUnread,
    setChannels,
    setSidebarChannels,
    openMeetingLauncher,
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
  const remoteTypingTimeoutsRef = useRef({});
  const hadTypingUsersRef = useRef(false);
  const menuRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showArchiveConfirmModal, setShowArchiveConfirmModal] = useState(false);
  const [showMessageDeleteModal, setShowMessageDeleteModal] = useState(false);
  const [showChannelDeleteModal, setShowChannelDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [showPinnedDetails, setShowPinnedDetails] = useState(false);
  const [historyCursor, setHistoryCursor] = useState(null);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const historyDayRef = useRef(null);
  const previousMemberCountRef = useRef(null);
  const touchStartYRef = useRef(null);
  
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
  const effectiveChannel = useMemo(
    () => channels.find((item) => item.id === channelId) || channel,
    [channels, channel, channelId]
  );
  const activeWorkspace = useMemo(
    () => workspaces.find((item) => String(item.id) === String(workspaceId)) || room,
    [workspaces, workspaceId, room]
  );
  const isWorkspaceOwner = String(activeWorkspace?.ownerId ?? activeWorkspace?.createdById) === String(currentUser?.id);
  const isDefaultChannel = Boolean(effectiveChannel?.isDefault || effectiveChannel?.name === 'general');
  const isChannelMember = useMemo(
    () => members.some((member) => String(member.id) === String(currentUser?.id)),
    [members, currentUser?.id]
  );
  const selectedMessage = useMemo(() => {
    const match = messages.find(m => m.id === selectedMessageId);
    return match && !match.isDeleted ? match : null;
  }, [messages, selectedMessageId]);

  const scrollToBottom = (behavior = 'smooth') => {
    scrollRef.current?.scrollIntoView({ behavior });
  };

  function normalizeCursorPayload(payload) {
    if (!payload) {
      return { items: [], hasMore: false, nextCursorSentAt: null, nextCursorId: null };
    }

    if (Array.isArray(payload)) {
      return { items: payload, hasMore: false, nextCursorSentAt: null, nextCursorId: null };
    }

    if (Array.isArray(payload.content)) {
      return {
        items: payload.content,
        hasMore: Boolean(payload.hasNext),
        nextCursorSentAt: null,
        nextCursorId: null,
      };
    }

    return {
      items: payload.items ?? [],
      hasMore: Boolean(payload.hasMore),
      nextCursorSentAt: payload.nextCursorSentAt ?? null,
      nextCursorId: payload.nextCursorId ?? null,
    };
  }

  function getMessageDayKey(message) {
    const sentAt = normalizeTimestamp(message?.sentAt);
    if (!sentAt) return null;
    const date = new Date(sentAt);
    if (Number.isNaN(date.getTime())) return null;
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  function normalizeTimestamp(value) {
    if (!value) return null;
    if (Array.isArray(value) && value.length >= 6) {
      const date = new Date(value[0], value[1] - 1, value[2], value[3], value[4], value[5]);
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }
    return value;
  }

  async function fetchChannelDayChunk(initialCursor = null) {
    if (!channelId) {
      return { messages: [], nextCursor: null, hasMore: false, dayKey: null };
    }

    let cursor = initialCursor;
    let loopHasMore = true;
    let dayKey = null;
    let nextCursor = null;
    const collected = [];

    while (loopHasMore) {
      const response = await chatService.getChannelMessages(channelId, {
        cursorSentAt: cursor?.sentAt,
        cursorId: cursor?.id,
        size: 50,
      });
      const history = normalizeCursorPayload(response);
      const batch = history.items ?? [];

      if (batch.length === 0) {
        return {
          messages: collected,
          nextCursor: null,
          hasMore: false,
          dayKey,
        };
      }

      let boundaryReached = false;

      for (const message of batch) {
        const messageDayKey = getMessageDayKey(message);
        if (!dayKey) {
          dayKey = messageDayKey;
        }

        if (messageDayKey !== dayKey) {
          boundaryReached = true;
          nextCursor = {
            sentAt: normalizeTimestamp(message.sentAt),
            id: message.id,
          };
          break;
        }

        collected.push(message);
      }

      if (boundaryReached) {
        return {
          messages: collected,
          nextCursor,
          hasMore: true,
          dayKey,
        };
      }

      if (!history.hasMore) {
        return {
          messages: collected,
          nextCursor: null,
          hasMore: false,
          dayKey,
        };
      }

      const lastMessage = batch[batch.length - 1];
      cursor = {
        sentAt: normalizeTimestamp(lastMessage.sentAt),
        id: lastMessage.id,
      };
      loopHasMore = Boolean(history.hasMore);
    }

    return {
      messages: collected,
      nextCursor,
      hasMore: false,
      dayKey,
    };
  }

  async function refreshChannelMessages() {
    if (!channelId) return;
    try {
      const dayChunk = await fetchChannelDayChunk(null);
      const nextMessages = [...(dayChunk.messages ?? [])].reverse();
      setChannelMessages(channelId, nextMessages);
      setHasMoreHistory(Boolean(dayChunk.hasMore));
      setHistoryCursor(dayChunk.nextCursor);
      historyDayRef.current = dayChunk.dayKey;
    } catch (error) {
      console.error('Failed to refresh channel messages', error);
    }
  }

  async function loadOlderChannelMessages() {
    if (!channelId || loadingOlder || !hasMoreHistory || !historyCursor) return;

    const container = messageContainerRef.current;
    const previousScrollHeight = container?.scrollHeight ?? 0;
    const previousScrollTop = container?.scrollTop ?? 0;
    setLoadingOlder(true);

    try {
      const history = await fetchChannelDayChunk(historyCursor);
      const olderMessages = [...(history.messages ?? [])].reverse();

      if (olderMessages.length > 0) {
        prependChannelMessages(channelId, olderMessages);
        requestAnimationFrame(() => {
          if (!container) return;
          const nextScrollHeight = container.scrollHeight;
          container.scrollTop = nextScrollHeight - previousScrollHeight + previousScrollTop;
        });
      }

      setHasMoreHistory(Boolean(history.hasMore));
      setHistoryCursor(history.nextCursor);
    } catch (error) {
      console.error('Failed to load older channel messages', error);
    } finally {
      setLoadingOlder(false);
    }
  }

  async function refreshChannelContext() {
    if (!channelId || !workspaceId) return;
    try {
      const [membersResponse, channelsResponse] = await Promise.all([
        userService.getChannelMembers(channelId),
        channelService.getWorkspaceChannels(workspaceId),
      ]);

      const membersData = membersResponse?.data?.data || membersResponse?.data || membersResponse;
      const nextMembers = Array.isArray(membersData) ? membersData : (Array.isArray(membersData?.content) ? membersData.content : []);
      setMembers(nextMembers);

      const channelsData = channelsResponse?.data?.data || channelsResponse?.data || channelsResponse;
      const nextChannels = Array.isArray(channelsData) ? channelsData : (Array.isArray(channelsData?.content) ? channelsData.content : []);
      setChannels(nextChannels);
      if (useChatStore.getState().sidebarMode === 'channels') {
        setSidebarChannels(nextChannels);
      }
    } catch (error) {
      console.error('Failed to refresh channel context', error);
    }
  }

  function updateChannelMembershipInStore(memberDelta) {
    if (!channelId) return;

    const applyMemberDelta = (list = []) =>
      list.map((item) => {
        if (item.id !== channelId) return item;
        const currentCount = Number(item.memberCount ?? 0);
        return {
          ...item,
          memberCount: Math.max(currentCount + memberDelta, 0),
        };
      });

    setChannels((prev) => applyMemberDelta(prev));
    if (useChatStore.getState().sidebarMode === 'channels') {
      setSidebarChannels((prev = []) => applyMemberDelta(prev));
    }
  }

  function removeCurrentChannelFromStore() {
    if (!channelId) return;
    setChannels((prev) => prev.filter((item) => item.id !== channelId));
    if (useChatStore.getState().sidebarMode === 'channels') {
      setSidebarChannels((prev = []) => prev.filter((item) => item.id !== channelId));
    }
  }

  async function navigateToWorkspaceDefaultChannel() {
    if (!workspaceId) {
      navigate('/');
      return;
    }

    try {
      const response = await channelService.getWorkspaceChannels(workspaceId);
      const channelsData = response?.data?.data || response?.data || [];
      const visibleChannels = Array.isArray(channelsData) ? channelsData : [];

      setChannels(visibleChannels);
      setSidebarChannels(visibleChannels);
      useChatStore.getState().setSidebarMode('channels');

      const fallbackChannel = visibleChannels.find((item) => item.name === 'general' || item.isDefault) || visibleChannels[0];
      if (fallbackChannel?.id) {
        navigate(`/chat/channel/${fallbackChannel.id}`);
        return;
      }
    } catch (error) {
      console.error('Failed to load fallback channel', error);
    }

    navigate(`/chat/workspace/${workspaceId}`);
  }

  function removeMemberFromLocalState(matcher) {
    const removedCount = members.filter((member) => matcher(member)).length;
    setMembers((prev) => prev.filter((member) => !matcher(member)));

    if (removedCount > 0) {
      updateChannelMembershipInStore(-removedCount);
    }
  }

  function syncChannelMembershipAfterSystemMessage(message) {
    if (!message?.content || !channelId) return;

    if (message.content.includes(' left #')) {
      const leavingName = message.content.split(' left #')[0]?.trim();
      removeMemberFromLocalState((member) =>
        String(member.id) === String(message.senderId) ||
        (leavingName && member.displayName?.trim() === leavingName)
      );
      return;
    }

    if (message.content.includes(' was removed from #')) {
      const removedName = message.content.split(' was removed from #')[0]?.trim();
      removeMemberFromLocalState((member) => removedName && member.displayName?.trim() === removedName);
      return;
    }

    refreshChannelContext();
  }

  function clearMentionNotificationsForMessages(messageIds = []) {
    if (!messageIds.length) return;
    const messageIdSet = new Set(messageIds.map((id) => String(id)));
    useChatStore.getState().setNotifications((prev) =>
      prev.filter(
        (notification) =>
          !(
            notification?.type === 'MENTION' &&
            messageIdSet.has(String(notification?.relatedEntityId))
          )
      )
    );
  }

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
        setHistoryCursor(null);
        setHasMoreHistory(true);
        historyDayRef.current = null;
        if (entityType !== 'channel') {
           setLoading(false);
           return;
        }

        const dayChunk = await fetchChannelDayChunk(null);
        if (!mounted) return;

        const newMessages = [...(dayChunk.messages ?? [])].reverse();
        console.log('Loaded', newMessages.length, 'messages for channel', entityId);
        setChannelMessages(entityId, newMessages);
        setHasMoreHistory(Boolean(dayChunk.hasMore));
        setHistoryCursor(dayChunk.nextCursor);
        historyDayRef.current = dayChunk.dayKey;

        // Fetch members separately Ã¢â‚¬â€ failure here must NOT block message display
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
          await notificationService.markRoomRead(entityId);
          clearMentionNotificationsForMessages(newMessages.map((message) => message.id));
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
                if (message?.senderId && String(message.senderId) !== String(currentUser?.id)) {
                  clearChannelUnread(entityId);
                  chatService.markChannelAsRead(entityId).catch((err) => {
                    console.error('Failed to mark active channel as read', err);
                  });
                  chatService.markAsRead(message.id).catch((err) => {
                    console.error('Failed to mark active message as read', err);
                  });
                  clearMentionNotificationsForMessages([message.id]);
                }
                if (message?.type === 'SYSTEM') {
                  syncChannelMembershipAfterSystemMessage(message);
                  setTimeout(() => refreshChannelMessages(), 250);
                  setTimeout(() => refreshChannelContext(), 250);
                }
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
              if (!event?.userId) return;
              const isTyping = event.isTyping ?? event.typing ?? false;

              window.clearTimeout(remoteTypingTimeoutsRef.current[event.userId]);

              if (isTyping) {
                setTyping(workspaceId, {
                  [event.userId]: { ...event, isTyping: true },
                });

                remoteTypingTimeoutsRef.current[event.userId] = window.setTimeout(() => {
                  setTyping(workspaceId, {
                    [event.userId]: null,
                  });
                }, 1000);
              } else {
                remoteTypingTimeoutsRef.current[event.userId] = window.setTimeout(() => {
                  setTyping(workspaceId, {
                    [event.userId]: null,
                  });
                }, 1000);
              }
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
      Object.values(remoteTypingTimeoutsRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
      remoteTypingTimeoutsRef.current = {};
      setActiveThread(null);
    };
  }, [entityId, entityType, appendChannelMessage, appendRoomMessage, setChannelMessages, setRoomMessages, setTyping, setActiveThread, clearChannelUnread]);

  function handleMessageScroll(event) {
    if (entityType !== 'channel') return;
    if (event.currentTarget.scrollTop > 120) return;
    if (loading || loadingOlder) return;
    loadOlderChannelMessages();
  }

  function handleMessageWheel(event) {
    if (entityType !== 'channel') return;
    const container = messageContainerRef.current;
    if (!container) return;
    if (event.deltaY >= 0) return;
    if (container.scrollTop > 8) return;
    if (loading || loadingOlder) return;
    loadOlderChannelMessages();
  }

  function handleTouchStart(event) {
    touchStartYRef.current = event.touches?.[0]?.clientY ?? null;
  }

  function handleTouchMove(event) {
    if (entityType !== 'channel') return;
    const container = messageContainerRef.current;
    if (!container) return;
    const currentY = event.touches?.[0]?.clientY ?? null;
    if (currentY == null || touchStartYRef.current == null) return;
    const deltaY = currentY - touchStartYRef.current;
    if (deltaY <= 12) return;
    if (container.scrollTop > 8) return;
    if (loading || loadingOlder) return;
    loadOlderChannelMessages();
  }

  useEffect(() => {
    if (!channelId) return;

    const previousCount = previousMemberCountRef.current;
    const currentCount = members.length;

    if (previousCount !== null && previousCount !== currentCount) {
      refreshChannelMessages();
    }

    previousMemberCountRef.current = currentCount;
  }, [channelId, members.length]);

  useEffect(() => {
    if (entityType !== 'channel' || !channelId || !workspaceId) {
      return undefined;
    }

    const refreshContextIfVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshChannelContext();
      }
    };

    const intervalId = window.setInterval(refreshContextIfVisible, 5000);
    window.addEventListener('focus', refreshContextIfVisible);
    document.addEventListener('visibilitychange', refreshContextIfVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshContextIfVisible);
      document.removeEventListener('visibilitychange', refreshContextIfVisible);
    };
  }, [entityType, channelId, workspaceId]);

  useEffect(() => {
    if (showChannelInfo && entityType === 'channel') {
      refreshChannelContext();
    }
  }, [showChannelInfo, entityType, channelId, workspaceId]);

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

  useEffect(() => {
    const hasTypingUsers = Object.keys(typingUsers).length > 0;
    if (hasTypingUsers && !hadTypingUsersRef.current) {
      setTimeout(() => scrollToBottom('smooth'), 50);
    }
    hadTypingUsersRef.current = hasTypingUsers;
  }, [typingUsers]);

  async function handleSend(content, file) {
    try {
      let fileUrl = null;
      let fileMessageType = 'FILE';
      
      // 1. Upload file if present
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
        const filePayload = { content: fileUrl, type: fileMessageType, replyToMessageId: replyTarget?.id ?? null };
        const fileApiResponse = await chatService.sendChannelMessage(entityId, filePayload);
        const sentFileMessage = fileApiResponse?.data ?? fileApiResponse;
        if (sentFileMessage?.id) {
          appendChannelMessage(entityId, sentFileMessage);
        }
      }

      // 3. Send text message if content is present
      if (content && content.trim()) {
        const textPayload = { content, type: 'TEXT', replyToMessageId: replyTarget?.id ?? null };
        const textApiResponse = await chatService.sendChannelMessage(entityId, textPayload);
        const sentTextMessage = textApiResponse?.data ?? textApiResponse;
        if (sentTextMessage?.id) {
          appendChannelMessage(entityId, sentTextMessage);
        }
      }

      setTimeout(() => scrollToBottom('smooth'), 50);
      setReplyTarget(null);
    } catch (error) {
      console.error('Failed to send message:', error);
      addToast('Failed to send message.', 'error');
    }
  }

  async function handleEdit(message) {
    setEditTarget(message);
    setEditContent(message.content ?? '');
  }

  const cancelEdit = () => {
    setEditTarget(null);
    setEditContent('');
  };

  const cancelReply = () => {
    setReplyTarget(null);
  };

  const submitEditMessage = async (content) => {
    if (!editTarget) return;
    const nextContent = content.trim();
    if (!nextContent || nextContent === editTarget.content) {
      cancelEdit();
      return;
    }

    const apiResponse = await chatService.editMessage(editTarget.id, nextContent);
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
    cancelEdit();
  };

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
    setShowMessageDeleteModal(true);
  }

  const confirmDeleteMessage = async (scope = 'everyone') => {
    if (!deleteTarget) return;
    const message = deleteTarget;
    try {
      await chatService.deleteMessage(message.id, scope);
      if (scope === 'self') {
        if (entityType === 'channel') {
          removeChannelMessage(entityId, message.id);
        } else {
          removeRoomMessage(entityId, message.id);
        }
        addToast('Message removed from your view', 'success');
        return;
      }
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
      setShowMessageDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const handlePin = async (message) => {
    try {
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
      addToast(updatedMessage?.isPinned ? 'Message pinned' : 'Message unpinned', 'success');
    } catch (error) {
      addToast('Failed to update pin', 'error');
    }
  };

  const handleArchive = async () => {
    setShowArchiveConfirmModal(true);
  };

  const confirmArchive = async () => {
    try {
      await channelService.archiveChannel(channelId);
      removeCurrentChannelFromStore();
      
      setShowArchiveConfirmModal(false);
      addToast('Channel archived successfuly', 'success');
      await navigateToWorkspaceDefaultChannel();
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
      if (isDefaultChannel) {
        await workspaceService.leaveWorkspace(workspaceId);
        useChatStore.getState().setWorkspaces((prev) => prev.filter((item) => String(item.id) !== String(workspaceId)));
        useChatStore.getState().setChannels((prev) => prev.filter((item) => String(item.workspaceId) !== String(workspaceId)));
        useChatStore.getState().setSidebarChannels((prev = []) => prev.filter((item) => String(item.workspaceId) !== String(workspaceId)));
      } else {
        await channelService.leaveChannel(channelId);
        removeMemberFromLocalState((member) => String(member.id) === String(currentUser?.id));
        removeCurrentChannelFromStore();
      }
      setShowLeaveModal(false);
      if (isDefaultChannel) {
        navigate('/');
      } else {
        await navigateToWorkspaceDefaultChannel();
      }
    } catch (error) {
      console.error('Failed to leave channel:', error);
      addToast(error.response?.data?.message || 'Failed to leave channel.', 'error');
    }
  };

  const handleTransferOwnership = async () => {
    if (!newOwnerId) return;
    try {
      await channelService.transferOwnership(channelId, newOwnerId);
      await refreshChannelMessages();
      setShowTransferModal(false);
      setNewOwnerId(null);
      await refreshChannelContext();
      addToast('Admin role transferred', 'success');
    } catch (error) {
      console.error('Failed to transfer and leave:', error);
      addToast(error.response?.data?.message || 'Failed to transfer ownership.', 'error');
    }
  };

  const handleDeleteChannel = async () => {
    setShowChannelDeleteModal(true);
  };

  const confirmDeleteChannel = async () => {
    try {
      if (isDefaultChannel) {
        await workspaceService.deleteWorkspace(workspaceId);
        const { workspaces, channels, sidebarChannels, setWorkspaces, setChannels, setSidebarChannels } = useChatStore.getState();
        setWorkspaces(workspaces.filter((item) => String(item.id) !== String(workspaceId)));
        setChannels(channels.filter((item) => String(item.workspaceId) !== String(workspaceId)));
        setSidebarChannels((sidebarChannels || []).filter((item) => String(item.workspaceId) !== String(workspaceId)));
      } else {
        await channelService.deleteChannel(channelId);
        removeCurrentChannelFromStore();
      }
      
      setShowChannelDeleteModal(false);
      addToast(isDefaultChannel ? 'Workspace deleted successfully' : 'Channel moved to trash', 'success');
      if (isDefaultChannel) {
        navigate('/');
      } else {
        await navigateToWorkspaceDefaultChannel();
      }
    } catch (error) {
      console.error('Failed to delete channel:', error);
      addToast(
        error.response?.data?.message ||
        (isDefaultChannel
          ? 'Only the workspace owner can delete this workspace.'
          : 'Only the creator or workspace owner can delete this channel.'),
        'error'
      );
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
  const latestPinnedMessage = pinnedMessages[pinnedMessages.length - 1] ?? null;
  const additionalPinnedMessages = useMemo(
    () => pinnedMessages.filter((message) => message.id !== latestPinnedMessage?.id),
    [pinnedMessages, latestPinnedMessage?.id]
  );

  useEffect(() => {
    if (!selectedMessageId) return;
    const current = messages.find((m) => m.id === selectedMessageId);
    if (!current || current.isDeleted) {
      setSelectedMessageId(null);
      setShowMenu(false);
      setShowEmojiPicker(false);
    }
  }, [messages, selectedMessageId]);

  function handleTyping(isTyping) {
    if (!workspaceId || !currentUser?.id) return;
    publishTyping(workspaceId, {
      userId: currentUser?.id,
      displayName: currentUser?.displayName,
      avatar: currentUser?.avatarUrl,
      isTyping,
      channelId,
      roomId,
    });

    window.clearTimeout(typingTimeoutRef.current);
    if (isTyping) {
      typingTimeoutRef.current = window.setTimeout(() => {
        publishTyping(workspaceId, {
          userId: currentUser?.id,
          displayName: currentUser?.displayName,
          avatar: currentUser?.avatarUrl,
          isTyping: false,
          channelId,
          roomId,
        });
      }, 900);
    }
  }

  useEffect(() => () => {
    window.clearTimeout(typingTimeoutRef.current);
    if (workspaceId && currentUser?.id) {
      publishTyping(workspaceId, {
        userId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatarUrl,
        isTyping: false,
        channelId,
        roomId,
      });
    }
  }, [workspaceId, currentUser?.id, currentUser?.displayName, currentUser?.avatarUrl, channelId, roomId]);

  if (!entityId) {
    return (
      <EmptyState
        title="Select a channel or workspace"
        description="Choose a workspace from the home page and then a channel from the sidebar."
      />
    );
  }

  const name = effectiveChannel?.name || channel?.name || room?.name;
  const description = effectiveChannel?.description || channel?.description || room?.description;

  return (
    <section className="flex h-full min-h-0 flex-col bg-white overflow-hidden">
      <header className="flex items-center justify-between px-8 py-2.5 bg-white/50 backdrop-blur-md sticky top-0 z-20 transition-all duration-300">
        {loading && (
          <div className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-100 overflow-hidden">
            <div className="h-full bg-indigo-500 skeleton-loading" style={{ width: '40%' }}></div>
          </div>
        )}
          <div 
            className="flex items-center gap-3 cursor-pointer group/title select-none"
            onClick={() => setShowChannelInfo(true)}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${(effectiveChannel?.isPrivate || effectiveChannel?.private) ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'} transition-smooth group-hover/title:scale-110`}>
              {(effectiveChannel?.isPrivate || effectiveChannel?.private) ? (
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
                {members.length} members . Click for info
              </div>
            </div>
          </div>

        <div className="flex items-center gap-4">
          {channelId && (
            <button
              type="button"
              onClick={() => openMeetingLauncher({ channel: effectiveChannel || channel, workspaceId, mode: 'create' })}
              className="flex h-10 w-10 items-center justify-center text-[#3f0e40] transition hover:scale-105 hover:text-[#5f2161]"
              title="Create meeting"
            >
              <Video size={18} />
            </button>
          )}
          {!isDefaultChannel && (
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="hidden sm:flex items-center justify-center gap-2 bg-[#3f0e40] text-white px-6 h-9 !rounded-full font-bold text-sm transition-smooth hover:bg-[#350d36] hover:scale-[1.05] active:scale-[0.98] shadow-lg shadow-purple-900/10"
            >
              <Users size={16} />
              <span>Invite</span>
            </button>
          )}
          
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => {
                if (!showMenu) {
                  refreshChannelContext();
                }
                setShowMenu(!showMenu);
              }}
              className={`h-9 w-9 rounded-lg transition-smooth flex items-center justify-center ${
                showMenu ? 'bg-black/5 text-gray-900' : 'text-gray-400 hover:text-gray-900 hover:bg-black/5'
              }`}
            >
              <MoreVertical size={20} />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-2xl shadow-2xl z-50 py-2 border border-black/5 animate-in fade-in slide-in-from-top-4 duration-300 origin-top-right">
                
                {selectedMessage ? (
                  /* --- MESSAGE OPTIONS --- */
                  <>
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
                  </>
                ) : (
                  /* --- CHANNEL OPTIONS --- */
                  <>

                    
                    {!isDefaultChannel && !effectiveChannel?.isArchived && (
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

                    {isChannelMember && (!isDefaultChannel || !isWorkspaceOwner) && (
                      <button 
                        onClick={() => {
                          handleLeaveChannel();
                          setShowMenu(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[#1d1c1d] transition hover:bg-black/5"
                      >
                        <LogOut size={16} className="text-[#6b6a6b]" /> {isDefaultChannel ? 'Leave Workspace' : 'Leave Channel'}
                      </button>
                    )}

                    {((!isDefaultChannel && effectiveChannel?.role === 'ADMIN') || isWorkspaceOwner) && (
                      <button 
                        onClick={() => {
                          handleDeleteChannel();
                          setShowMenu(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[#e01e5a] transition hover:bg-[#e01e5a]/10"
                      >
                        <Trash2 size={16} className="text-[#e01e5a]" /> {isDefaultChannel ? 'Delete Workspace' : 'Delete Channel'}
                      </button>
                    )}
                  </>
                )}

                {!isDefaultChannel && (
                  <button 
                    onClick={() => {
                      setShowInviteModal(true);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[#1d1c1d] transition hover:bg-black/5 lg:hidden border-t border-black/5"
                  >
                    <Users size={16} className="text-[#6b6a6b]" /> Invite member
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <ChannelInfoDrawer 
        isOpen={showChannelInfo}
        onClose={() => setShowChannelInfo(false)}
        channel={effectiveChannel}
        members={members}
        isWorkspaceOwner={isWorkspaceOwner}
        onMemberPromoted={(userId) => {
          setMembers((prev) =>
            prev.map((member) =>
              String(member.id) === String(userId) ? { ...member, role: 'ADMIN' } : member
            )
          );
          refreshChannelContext();
          refreshChannelMessages();
        }}
        onMemberDemoted={(userId) => {
          setMembers((prev) =>
            prev.map((member) =>
              String(member.id) === String(userId) ? { ...member, role: 'MEMBER' } : member
            )
          );
          refreshChannelContext();
          refreshChannelMessages();
        }}
        onMemberRemoved={(userId) => {
          removeMemberFromLocalState((member) => String(member.id) === String(userId));
          refreshChannelMessages();
        }}
      />

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

      <div
        ref={messageContainerRef}
        onScroll={handleMessageScroll}
        onWheel={handleMessageWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="scrollbar-thin flex-1 overflow-y-auto"
      >
        {!loading && entityType === 'channel' && (
          <div className="px-8 pt-4 text-center">
            <div className="text-xs font-bold tracking-wide text-gray-400">
              {loadingOlder ? 'Loading older messages...' : hasMoreHistory ? 'Scroll up to load older messages' : 'Start of conversation'}
            </div>
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
              onClick={() => handleSend('Hello everyone,')}
              className="mt-8 bg-[#2c0b2d] text-white px-6 py-3 rounded-2xl font-bold transition-smooth hover:bg-[#1a061b] hover:scale-110 active:scale-95 shadow-lg shadow-[#2c0b2e]/20"
            >
              Say Hello!
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
                  isSelected={!message.isDeleted && selectedMessageId === message.id}
                  participants={members}
                  onClick={() => {
                    if (message.isDeleted) {
                      setSelectedMessageId(null);
                      setShowMenu(false);
                      setShowEmojiPicker(false);
                      return;
                    }
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
        onSendMessage={editTarget ? submitEditMessage : handleSend}
        onTyping={handleTyping}
        disabled={channel?.isArchived}
        mentionSuggestions={members}
        currentUserId={currentUser.id}
        editMode={Boolean(editTarget)}
        editValue={editContent}
        onCancelEdit={cancelEdit}
        editLabel={editTarget?.content}
        submitLabel="Save"
        replyTarget={replyTarget}
        onCancelReply={cancelReply}
      />
      <ChannelInviteModal 
        isOpen={showInviteModal} 
        onClose={() => setShowInviteModal(false)}
        channelId={channelId}
        workspaceId={workspaceId}
        channelName={name}
      />

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
              Transfer Admin
            </button>
          </div>
        </div>
      </Modal>

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

      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title={isDefaultChannel ? "Leave Workspace" : "Leave Channel"}
        rounded="rounded-none"
      >
        <div className="p-1">
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            {isDefaultChannel ? (
              <>Are you sure you want to leave <strong>{activeWorkspace?.name}</strong>? You will lose access to this workspace and all of its channels.</>
            ) : (
              <>Are you sure you want to leave <strong>#{channel?.name}</strong>?{channel?.isPrivate ? " Since this is a private channel, you'll need an invite to join again." : " You can rejoin this public channel anytime."}</>
            )}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowLeaveModal(false)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              {isDefaultChannel ? 'Stay in Workspace' : 'Keep Channel'}
            </button>
            <button
              onClick={confirmLeaveChannel}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-md active:scale-95"
            >
              {isDefaultChannel ? 'Leave Workspace' : 'Leave Channel'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showMessageDeleteModal}
        onClose={() => setShowMessageDeleteModal(false)}
        title="Delete message?"
        rounded="rounded-none"
      >
        <div className="p-1">
          <p className="mb-6 text-sm leading-relaxed text-gray-500">
            Choose how you want to delete this message.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => confirmDeleteMessage('self')}
              className="w-full rounded-none border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Delete from me
            </button>
            {deleteTarget?.senderId === currentUser?.id && (
              <button
                onClick={() => confirmDeleteMessage('everyone')}
                className="w-full rounded-none bg-red-600 px-4 py-3 text-left text-sm font-bold text-white transition-all hover:bg-red-700"
              >
                Delete from everyone
              </button>
            )}
            <button
              onClick={() => setShowMessageDeleteModal(false)}
              className="w-full rounded-none border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showChannelDeleteModal}
        onClose={() => setShowChannelDeleteModal(false)}
        title={isDefaultChannel ? "Delete Workspace" : "Move to Trash"}
      >
        <div className="p-1">
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            {isDefaultChannel ? (
              <>Delete <strong>{activeWorkspace?.name}</strong>? This will remove the entire workspace, including all channels, for every member.</>
            ) : (
              <>Move <strong>#{channel?.name}</strong> to Trash? 
              This channel will be hidden for everyone, but can be restored by the workspace owner or creator from the Trash Bin.</>
            )}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowChannelDeleteModal(false)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteChannel}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-md active:scale-95"
            >
              {isDefaultChannel ? 'Delete Workspace' : 'Move to Trash'}
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
