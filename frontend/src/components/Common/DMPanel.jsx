import { MessageSquare, X, Check } from 'lucide-react';
import { useState } from 'react';
import useChatStore from '../../store/chatStore';
import { formatMessageTimestamp } from '../../utils/formatDate';
import notificationService from '../../services/notificationService';
import dmRequestService from '../../services/dmRequestService';
import userService from '../../services/userService';
import { useEffect } from 'react';

const DMPanel = () => {
  const { notifications, setNotifications, sharedUsers, setSharedUsers } = useChatStore();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);

  const dmNotifications = (notifications || []).filter(
    (n) => (n.type === 'DIRECT_MESSAGE' || n.type === 'DM_INVITE') && !n.isRead && !n.read
  );

  // Calculate total badge count from both persistent notifications (invites)
  // and real-time user-specific unread counts (messages)
  const dmUnreadFromMessages = (sharedUsers || []).reduce((sum, u) => sum + (u.unreadCount || 0), 0);
  const totalUnreadCount = dmNotifications.length + pendingRequests.length + dmUnreadFromMessages;

  useEffect(() => {
    let mounted = true;
    async function loadRequests() {
      try {
        const resp = await dmRequestService.getPendingRequests();
        if (mounted) setPendingRequests(resp.data || []);
      } catch (e) {
        console.error('Failed to load pending requests', e);
      }
    }
    if (isOpen) {
      loadRequests();
      const interval = setInterval(loadRequests, 10000);
      return () => {
        mounted = false;
        clearInterval(interval);
      };
    }
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark DM notification as read', error);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await dmRequestService.acceptRequest(requestId);
      // Refresh pending requests
      const resp = await dmRequestService.getPendingRequests();
      setPendingRequests(resp.data || []);
      // Refresh shared users for sidebar
      const usersResp = await userService.getSharedRoomUsers();
      setSharedUsers(usersResp.data || []);
    } catch (e) {
      console.error('Failed to accept request', e);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await dmRequestService.rejectRequest(requestId);
      const resp = await dmRequestService.getPendingRequests();
      setPendingRequests(resp.data || []);
    } catch (e) {
      console.error('Failed to reject request', e);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex h-10 w-10 items-center justify-center text-white/70 transition hover:bg-white/10 hover:text-white ${isOpen ? 'bg-white/10 text-white' : ''}`}
        title="Direct Messages"
      >
        <MessageSquare size={22} />
        {totalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#e01e5a] px-1.5 text-[10px] font-bold text-white pointer-events-none shadow-md shadow-[#e01e5a]/30">
            {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
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
                <h3 className="font-semibold text-[#1d1c1d]">Direct Messages</h3>
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
              {pendingRequests.length > 0 && (
                <div className="border-b border-black/8 bg-[#3f0e40]/5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#3f0e40]">
                  Pending Invitations ({pendingRequests.length})
                </div>
              )}
              {pendingRequests.map((req) => (
                <div key={req.id} className="border-b border-black/5 px-4 py-4 bg-white hover:bg-black/[0.02]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#3f0e40] font-bold text-white overflow-hidden">
                      {req.sender.avatarUrl ? (
                        <img src={req.sender.avatarUrl} alt={req.sender.displayName} className="h-full w-full object-cover" />
                      ) : (
                        req.sender.displayName?.[0]?.toUpperCase() ?? 'U'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#1d1c1d]">{req.sender.displayName}</span>
                      </div>
                      <p className="text-xs text-[#6b6a6b] mt-0.5">Sent you a direct message invitation</p>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleAccept(req.id)}
                          className="flex flex-1 items-center justify-center gap-1.5 bg-[#2bac76] text-white py-2 text-xs font-bold hover:bg-[#2bac76]/90 transition"
                        >
                          <Check size={14} /> Accept
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="flex flex-1 items-center justify-center gap-1.5 bg-black/5 text-[#e01e5a] py-2 text-xs font-bold hover:bg-black/10 transition"
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {pendingRequests.length === 0 && dmNotifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-[#6b6a6b]">
                  No DM activities yet
                </div>
              ) : (
                <>
                  {dmNotifications.length > 0 && (
                    <div className="border-b border-black/8 bg-black/[0.02] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#6b6a6b]">
                      Recent Messages
                    </div>
                  )}
                  {dmNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-b border-black/5 px-4 py-3 transition hover:bg-black/[0.02] ${
                      !notification.isRead ? 'bg-[#3f0e40]/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-xl">
                        {notification.type === 'DM_INVITE' ? '💌' : '✉️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#1d1c1d]">
                          {notification.content}
                        </p>
                        <p className="mt-1 text-xs text-[#6b6a6b]">
                          {formatMessageTimestamp(notification.createdAt)}
                        </p>
                        {!notification.isRead && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="mt-2 flex items-center gap-1 text-xs text-[#3f0e40] font-semibold hover:underline"
                          >
                            <Check size={12} />
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </>
    )}

    </div>
  );
};

export default DMPanel;
