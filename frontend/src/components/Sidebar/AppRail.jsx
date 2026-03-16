import { Bell, LogOut, MessageSquare, Plus, UserCircle, Home } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import NotificationPanel from '../Common/NotificationPanel';
import DMPanel from '../Common/DMPanel';

const AppRail = ({ onCreateRoom }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { notifications, workspaces } = useChatStore();

  const handleHomeClick = () => {
    if (workspaces && workspaces.length > 0) {
      navigate(`/chat/workspace/${workspaces[0].id}`);
    } else {
      navigate('/profile');
    }
  };

  const firstWorkspaceInitials = (workspaces && workspaces.length > 0) 
    ? workspaces[0].name.substring(0, 2).toUpperCase() 
    : 'BC';

  return (
    <div className="flex h-full w-[68px] flex-col items-center bg-[#2c0b2e] py-4 text-white">
      {/* Branding */}
      <div className="mb-6 flex h-10 w-10 items-center justify-center bg-[#3f0e40] text-sm font-bold border border-white/10">
        {firstWorkspaceInitials}
      </div>

      <div className="flex flex-1 flex-col items-center gap-6">
        {/* Home */}
        <button
          onClick={handleHomeClick}
          className="flex h-10 w-10 items-center justify-center text-white/70 transition hover:bg-white/10 hover:text-white"
          title="Home - First Workspace"
        >
          <Home size={22} />
        </button>

        {/* Create Workspace */}
        <button
          onClick={onCreateRoom}
          className="flex h-10 w-10 items-center justify-center transition hover:bg-white/10"
          title="Create Workspace"
        >
          <Plus size={22} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <NotificationPanel />
        </div>

        {/* Direct Messages Hub */}
        <DMPanel />
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
