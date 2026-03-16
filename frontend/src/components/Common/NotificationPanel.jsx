import { Bell, Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import notificationService from '../../services/notificationService';
import { subscribeToNotifications } from '../../services/websocket';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import chatService from '../../services/chatService';
import userService from '../../services/userService';
import { formatMessageTimestamp } from '../../utils/formatDate';
import useToastStore from '../../store/toastStore';

const NotificationPanel = ({ variant = 'light' }) => {
  const currentUser = useAuthStore((state) => state.user);
  const { notifications, setNotifications } = useChatStore();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Variant styles: 'light' is for dark backgrounds (sidebar), 'dark' is for light backgrounds (landing page)
  const styles = variant === 'dark' 
    ? {
        button: 'text-[#1d1c1d] hover:bg-black/5',
        active: 'bg-black/5',
        panel: 'left-full top-0 ml-4'
      }
    : {
        button: 'text-white/70 hover:bg-white/10 hover:text-white',
        active: 'bg-white/10 text-white',
        panel: 'left-full top-0 ml-4'
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

    // Subscribe to real-time notifications
    subscribeToNotifications(currentUser.id, (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });
  }, [currentUser?.id, setNotifications]);

  const relevantNotifications = notifications.filter(
    (n) => (n.type === 'MENTION' || n.type === 'ROOM_INVITE' || n.type === 'CHANNEL_INVITE' || n.type === 'WORKSPACE_INVITE') && !n.isRead && !n.read
  );

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const handleAccept = async (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    try {
      await notificationService.accept(notificationId);
      
      // Immediately remove from list locally
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

      // Re-fetch rooms/workspaces and shared users if it was an invite
      if (notification?.type === 'ROOM_INVITE' || notification?.type === 'CHANNEL_INVITE' || notification?.type === 'WORKSPACE_INVITE') {
        try {
            // Refresh workspaces
            const workspacesRes = await chatService.getWorkspaces();
            const workspaces = workspacesRes.data?.content || workspacesRes.data || (Array.isArray(workspacesRes) ? workspacesRes : []);
            useChatStore.getState().setWorkspaces(workspaces);

            // Legacy support for rooms if needed
            const roomsData = await chatService.getRooms();
            const rooms = roomsData.data?.content || roomsData.content || roomsData.data || (Array.isArray(roomsData) ? roomsData : []);
            useChatStore.getState().setRooms(rooms);

            const usersRes = await userService.getSharedRoomUsers();
            useChatStore.getState().setSharedUsers(usersRes.data || usersRes || []);
            
            useChatStore.getState().setNotifications(prev => prev.filter(n => n.id !== notificationId));
            useToastStore.getState().addToast('Invite accepted successfully!', 'success');
        } catch (fetchError) {
            console.error('Failed to refresh data after accept', fetchError);
        }
      }
    } catch (error) {
      console.error('Failed to accept notification', error);
    }
  };

  const handleReject = async (notificationId) => {
    try {
      // For room invite, we just mark as read to "clear" it
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to reject notification', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'MENTION':
        return '💬';
      case 'DIRECT_MESSAGE':
        return '✉️';
      case 'ROOM_INVITE':
      case 'CHANNEL_INVITE':
      case 'WORKSPACE_INVITE':
        return '📨';
      default:
        return '🔔';
    }
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
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center bg-[#e01e5a] text-[10px] font-bold text-white">
            {relevantNotifications.length > 9 ? '9+' : relevantNotifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className={`absolute z-50 w-96 border border-black/8 bg-white shadow-xl ${variant === 'dark' ? 'right-0 top-full mt-2' : 'left-full top-0 ml-4'}`}>
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
                      <div className="text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#1d1c1d]">
                          {notification.content}
                        </p>
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
