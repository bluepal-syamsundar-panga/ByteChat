import { Bell, Hash, Lock, Mail, MessageCircleMore, Plus } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';

const Sidebar = ({ onCreateRoom, onAcceptInvite }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { rooms, notifications } = useChatStore();
  const unreadNotifications = notifications.filter((item) => !(item.read || item.isRead)).length;
  const inviteNotifications = notifications.filter((item) => item.type === 'ROOM_INVITE' && !(item.read || item.isRead));
  const directMessageNotifications = notifications.filter((item) => item.type === 'DIRECT_MESSAGE' && !(item.read || item.isRead));

  return (
    <aside className="flex w-full max-w-[340px] shrink-0 flex-col bg-[#3f0e40] text-white md:w-[340px]">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Workspace</div>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">ByteChat</div>
            <div className="text-sm text-white/70">Your rooms, invites, mentions, and DMs</div>
          </div>
          <button
            onClick={onCreateRoom}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 transition hover:bg-white/18"
            title="Create room"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <section className="rounded-3xl bg-white/6 p-3">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">You</div>
          <NavLink to="/profile" className="mt-3 flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-white/8">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white/14 font-bold">
              {user?.displayName?.[0]?.toUpperCase() ?? 'U'}
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#3f0e40] bg-[#2bac76]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{user?.displayName ?? 'Member'}</div>
              <div className="truncate text-xs text-white/60">{user?.email}</div>
            </div>
            {unreadNotifications > 0 && (
              <div className="rounded-full bg-[#e01e5a] px-2 py-1 text-xs font-semibold">{unreadNotifications}</div>
            )}
          </NavLink>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between px-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
            <span>My rooms</span>
            <span>{rooms.length}</span>
          </div>
          <div className="space-y-1">
            {rooms.map((room) => (
              <SidebarLink
                key={room.id}
                to={`/chat/room/${room.id}`}
                isActive={location.pathname === `/chat/room/${room.id}`}
                icon={room.private ? <Lock size={16} /> : <Hash size={16} />}
                title={room.name}
                subtitle={room.description || 'Workspace room'}
                badge={room.isArchived ? 'ARCHIVED' : null}
              />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between px-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
            <span className="flex items-center gap-2">
              <Bell size={14} />
              Notifications
            </span>
            <span>{unreadNotifications}</span>
          </div>
          <div className="space-y-2">
            {notifications.length === 0 && (
              <div className="rounded-2xl bg-white/6 px-3 py-3 text-sm text-white/60">No notifications yet.</div>
            )}

            {inviteNotifications.map((notification) => (
              <div key={notification.id} className="rounded-2xl bg-white/8 px-3 py-3">
                <div className="flex items-start gap-2">
                  <Mail size={16} className="mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="font-semibold">Room invite</div>
                    <div className="mt-1 text-white/70">{notification.content}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onAcceptInvite(notification.id)}
                  className="mt-3 rounded-full bg-[#1164a3] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0c548a]"
                >
                  Accept invite
                </button>
              </div>
            ))}

            {notifications
              .filter((item) => item.type !== 'ROOM_INVITE')
              .slice(0, 5)
              .map((notification) => (
                <div key={notification.id} className="rounded-2xl bg-white/6 px-3 py-3 text-sm">
                  <div className="font-semibold">{notification.type.replaceAll('_', ' ')}</div>
                  <div className="mt-1 text-white/70">{notification.content}</div>
                </div>
              ))}
          </div>
        </section>

        <section className="rounded-3xl bg-[#350d36] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <MessageCircleMore size={16} />
            Direct messages
          </div>
          {directMessageNotifications.length === 0 ? (
            <p className="text-sm leading-6 text-white/70">Direct message notifications will appear here.</p>
          ) : (
            <div className="space-y-2">
              {directMessageNotifications.slice(0, 4).map((notification) => (
                <div key={notification.id} className="rounded-2xl bg-white/8 px-3 py-3 text-sm">
                  {notification.content}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </aside>
  );
};

const SidebarLink = ({ to, isActive, icon, title, subtitle, badge }) => (
  <NavLink
    to={to}
    className={`flex items-start gap-3 rounded-2xl px-3 py-2.5 transition ${
      isActive ? 'bg-[#1164a3] text-white shadow-md' : 'text-white/85 hover:bg-white/8'
    }`}
  >
    <div className="mt-0.5 shrink-0">{icon}</div>
    <div className="min-w-0 flex-1">
      <div className="truncate text-sm font-medium">{title}</div>
      <div className="truncate text-xs text-white/60">{subtitle}</div>
    </div>
    {badge && <div className="rounded-full bg-white/12 px-2 py-1 text-[10px] font-bold">{badge}</div>}
  </NavLink>
);

export default Sidebar;
