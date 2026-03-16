import { Bell, Hash, Lock, Mail, MessageCircleMore, Plus, Check, X } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import userService from '../../services/userService';
const Sidebar = ({ onCreateRoom, onAcceptInvite }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { rooms, sharedUsers, setSharedUsers } = useChatStore();
  
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const usersResp = await userService.getSharedRoomUsers();
        if (mounted) {
          setSharedUsers(usersResp.data || []);
        }
      } catch (e) {
        console.error('Failed to load sidebar data', e);
      }
    }
    loadData();
    // Poll for updates every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [setSharedUsers]);

  return (
    <aside className="flex w-full max-w-[340px] shrink-0 flex-col bg-[#3f0e40] text-white md:w-[340px]">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Workspace</div>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">ByteChat</div>
            <div className="text-sm text-white/70">Rooms, invites, and DMs</div>
          </div>
        </div>
      </div>

      <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-4">


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

        <section className="bg-[#350d36] p-4 shadow-inner">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <MessageCircleMore size={16} />
            Direct messages
          </div>
          <div className="space-y-1">
            {sharedUsers.filter(u => u.id !== user?.id).map((u) => (
              <SidebarLink
                key={u.id}
                to={`/chat/dm/${u.id}`}
                isActive={location.pathname === `/chat/dm/${u.id}`}
                icon={
                  <div className="relative flex h-5 w-5 items-center justify-center bg-white/20 text-[10px] font-bold overflow-hidden">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.displayName} className="h-full w-full object-cover" />
                    ) : (
                      u.displayName?.[0]?.toUpperCase() ?? 'U'
                    )}
                    <span className={`absolute bottom-0 right-0 h-2 w-2 border-2 border-[#350d36] ${u.online ? 'bg-[#2bac76]' : 'bg-white/40'}`} />
                  </div>
                }
                title={u.displayName}
                subtitle={u.online ? 'Online' : 'Offline'}
                badge={null}
              />
            ))}
            {sharedUsers.length <= 1 && (
              <p className="px-2 py-1 text-sm leading-6 text-white/70">No shared room members found.</p>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
};

const SidebarLink = ({ to, isActive, icon, title, subtitle, badge }) => (
  <NavLink
    to={to}
    className={`flex items-start gap-3 px-3 py-2.5 transition ${isActive ? 'bg-white/10 text-white border-l-4 border-white' : 'text-white/85 hover:bg-white/8'
      }`}
  >
    <div className="mt-0.5 shrink-0">{icon}</div>
    <div className="min-w-0 flex-1">
      <div className="truncate text-sm font-medium">{title}</div>
      <div className="truncate text-xs text-white/60">{subtitle}</div>
    </div>
    {badge && <div className="bg-white/12 px-2 py-1 text-[10px] font-bold">{badge}</div>}
  </NavLink>
);

export default Sidebar;
