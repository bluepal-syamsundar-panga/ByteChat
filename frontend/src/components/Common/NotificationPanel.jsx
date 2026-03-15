import { Bell, Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import notificationService from '../../services/notificationService';
import { subscribeToNotifications } from '../../services/websocket';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import { formatMessageTimestamp } from '../../utils/formatDate';

const NotificationPanel = () => {
  const currentUser = useAuthStore((state) => state.user);
  const { notifications, setNotifications } = useChatStore();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const handleAccept = async (notificationId) => {
    try {
      await notificationService.accept(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to accept notification', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'MENTION':
        return '💬';
      case 'DIRECT_MESSAGE':
        return '✉️';
      case 'INVITE':
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
        className={`relative p-2 text-white/70 transition hover:bg-white/10 hover:text-white ${isOpen ? 'bg-white/10 text-white' : ''}`}
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center bg-[#e01e5a] text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-full top-0 z-50 ml-4 w-96 border border-black/8 bg-white shadow-xl">
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
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-[#6b6a6b]">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-b border-black/5 px-4 py-3 transition hover:bg-black/[0.02] ${
                      !notification.isRead ? 'bg-[#3f0e40]/5' : ''
                    }`}
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
                          {!notification.isRead && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="flex items-center gap-1 bg-[#3f0e40] px-2 py-1 text-xs text-white transition hover:bg-[#350d36]"
                            >
                              <Check size={12} />
                              Mark as read
                            </button>
                          )}
                          {notification.type === 'INVITE' && (
                            <button
                              type="button"
                              onClick={() => handleAccept(notification.id)}
                              className="bg-[#007a5a] px-2 py-1 text-xs text-white transition hover:bg-[#005a3f]"
                            >
                              Accept
                            </button>
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
