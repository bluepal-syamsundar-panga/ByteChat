import { Bell, Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import notificationService from '../../services/notificationService';
import { subscribeToNotifications } from '../../services/websocket';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import chatService from '../../services/chatService';
import userService from '../../services/userService';
import { formatMessageTimestamp } from '../../utils/formatDate';
import channelService from '../../services/channelService';
import useToastStore from '../../store/toastStore';

const NotificationPanel = ({ variant = 'light', position = 'right', allowedTypes = null }) => {
  const currentUser = useAuthStore((state) => state.user);
  const { notifications, setNotifications } = useChatStore();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const styles = variant === 'dark'
    ? {
      button: 'text-[#1d1c1d] hover:bg-black/5',
      active: 'bg-black/5',
    }
    : {
      button: 'text-white/70 hover:bg-white/10 hover:text-white',
      active: 'bg-white/10 text-white',
    };

  useEffect(() => {
    if (!currentUser?.id) return;

    async function loadNotifications() {
      setLoading(true);
      try {
        const response = await notificationService.getNotifications();
        setNotifications(response.data || []);
      } catch (error) {
        console.error('Failed to load notifications', error);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();

    subscribeToNotifications(currentUser.id, (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });
  }, [currentUser?.id, setNotifications]);

  const allowedTypeSet = Array.isArray(allowedTypes) && allowedTypes.length > 0
    ? new Set(allowedTypes)
    : null;

  const relevantNotifications = notifications.filter((notification) => {
    const defaultAllowed = ['MENTION', 'ROOM_INVITE', 'CHANNEL_INVITE', 'WORKSPACE_INVITE', 'MEETING_INVITE']
      .includes(notification.type);
    const typeAllowed = allowedTypeSet ? allowedTypeSet.has(notification.type) : defaultAllowed;
    return typeAllowed && !notification.isRead && !notification.read;
  });

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((item) => (item.id === notificationId ? { ...item, isRead: true, read: true } : item))
      );
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const handleAccept = async (notificationId) => {
    try {
      await notificationService.accept(notificationId);
      setNotifications((prev) => prev.filter((item) => item.id !== notificationId));

      try {
        const [workspacesRes, usersRes] = await Promise.all([
          chatService.getWorkspaces(),
          userService.getSharedRoomUsers()
        ]);

        const workspaces = workspacesRes.data?.data || workspacesRes.data?.content || workspacesRes.data || [];
        useChatStore.getState().setWorkspaces(Array.isArray(workspaces) ? workspaces : []);
        useChatStore.getState().setSharedUsers(usersRes.data || usersRes || []);

        const activeWorkspaceId = useChatStore.getState().activeWorkspaceId;
        if (activeWorkspaceId) {
          const channelsRes = await channelService.getWorkspaceChannels(activeWorkspaceId);
          const channelsData = channelsRes.data?.data || channelsRes.data?.content || channelsRes.data || [];
          const normalizedChannels = Array.isArray(channelsData) ? channelsData : [];
          useChatStore.getState().setChannels(normalizedChannels);
          if (useChatStore.getState().sidebarMode === 'channels') {
            useChatStore.getState().setSidebarChannels(normalizedChannels);
          }
        }

        useToastStore.getState().addToast('Invite accepted successfully!', 'success');
      } catch (fetchError) {
        console.error('Failed to refresh data after accept', fetchError);
      }
    } catch (error) {
      console.error('Failed to accept notification', error);
      useToastStore.getState().addToast('Failed to accept invitation', 'error');
    }
  };

  const handleReject = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
    } catch (error) {
      console.error('Failed to reject notification', error);
    }
  };

  const getNotificationIcon = (type) => {
    if (type === 'MENTION') return '💬';
    if (type === 'DIRECT_MESSAGE') return '✉️';
    if (type === 'MEETING_INVITE') return '📹';
    if (type === 'ROOM_INVITE' || type === 'CHANNEL_INVITE' || type === 'WORKSPACE_INVITE') return '📨';
    return '🔔';
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 transition-all ${styles.button} ${isOpen ? styles.active : ''}`}
        title="Notifications"
      >
        <Bell size={20} />
        {relevantNotifications.length > 0 && (
          <span className="absolute -top-1 -right-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#e01e5a] px-1.5 text-[10px] font-bold text-white shadow-md shadow-[#e01e5a]/30">
            {relevantNotifications.length > 9 ? '9+' : relevantNotifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className={`absolute z-50 w-96 rounded-none border border-black/8 bg-white shadow-xl ${position === 'bottom' ? 'right-0 top-full mt-2' : 'left-full top-0 ml-4'}`}>
            <div className="border-b border-black/8 px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#1d1c1d]">Notifications</h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-[#6b6a6b] transition hover:bg-black/5"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="px-4 py-8 text-center text-sm text-[#6b6a6b]">
                  Loading notifications...
                </div>
              ) : relevantNotifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-[#6b6a6b]">
                  No new notifications
                </div>
              ) : (
                relevantNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="border-b border-black/5 px-4 py-3 transition hover:bg-black/[0.02]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[#1d1c1d]">{notification.content}</p>
                        <p className="mt-1 text-xs text-[#6b6a6b]">
                          {formatMessageTimestamp(notification.createdAt)}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="flex items-center gap-1 bg-black/5 px-2 py-1 text-xs text-[#1d1c1d] transition hover:bg-black/10"
                          >
                            <Check size={12} />
                            Dismiss
                          </button>
                          {(notification.type === 'ROOM_INVITE' || notification.type === 'CHANNEL_INVITE' || notification.type === 'WORKSPACE_INVITE') && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleAccept(notification.id)}
                                className="bg-[#007a5a] px-2 py-1 text-xs text-white transition hover:bg-[#005a3f]"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(notification.id)}
                                className="bg-[#e01e5a] px-2 py-1 text-xs text-white transition hover:bg-[#c2184e]"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationPanel;
