import { Bell, LogOut, MessageSquare, Plus, UserCircle } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import NotificationPanel from '../Common/NotificationPanel';

const AppRail = ({ onCreateRoom }) => {
  const { user } = useAuthStore();
  const { notifications } = useChatStore();

  const unreadDMs = notifications.filter(
    (n) => n.type === 'DIRECT_MESSAGE' && !(n.read || n.isRead)
  ).length;

  return (
    <div className="flex h-full w-[68px] flex-col items-center bg-[#2c0b2e] py-4 text-white">
      {/* Branding */}
      <div className="mb-6 flex h-10 w-10 items-center justify-center bg-[#3f0e40] text-sm font-bold border border-white/10">
        BT
      </div>

      <div className="flex flex-1 flex-col items-center gap-6">
        {/* Create Room */}
        <button
          onClick={onCreateRoom}
          className="flex h-10 w-10 items-center justify-center transition hover:bg-white/10"
          title="Create Room"
        >
          <Plus size={22} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <NotificationPanel />
        </div>

        {/* DM Notifications */}
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center text-white/70 transition hover:bg-white/10 hover:text-white">
            <MessageSquare size={22} />
          </div>
          {unreadDMs > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center bg-[#e01e5a] text-[10px] font-bold text-white">
              {unreadDMs > 9 ? '9+' : unreadDMs}
            </span>
          )}
        </div>
      </div>

      {/* Profile */}
      <div className="mt-auto flex flex-col items-center gap-4">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex h-10 w-10 items-center justify-center transition hover:bg-white/10 overflow-hidden ${isActive ? 'bg-white/10 text-white' : 'text-white/70 shadow-sm'
            }`
          }
          title="Profile Settings"
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#3f0e40] text-xs font-bold">
              {user?.displayName?.[0]?.toUpperCase() ?? 'U'}
            </div>
          )}
        </NavLink>
        <button
          onClick={() => {
            const logout = useAuthStore.getState().logout;
            logout();
          }}
          className="mb-2 flex h-10 w-10 items-center justify-center text-white/70 transition hover:bg-white/10 hover:text-white"
          title="Sign Out"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
};

export default AppRail;
