import { Bell, Hash, Lock, Mail, MessageCircleMore, Plus, Check, X, Users2, Trash2 } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import userService from '../../services/userService';
import channelService from '../../services/channelService';
import chatService from '../../services/chatService';
import workspaceService from '../../services/workspaceService';

const Sidebar = ({ onAcceptInvite }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { 
    workspaces, 
    channels, 
    setChannels, 
    sharedUsers, 
    setSharedUsers, 
    setActiveWorkspaceId: setStoreActiveWorkspaceId,
    setIsCreateChannelModalOpen,
    sidebarMode,
    setSidebarMode
  } = useChatStore();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(useChatStore.getState().activeWorkspaceId);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [channelMembersList, setChannelMembersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const workspaceIdMatch = location.pathname.match(/\/chat\/workspace\/(\d+)/);
    const channelIdMatch = location.pathname.match(/\/chat\/channel\/(\d+)/);
    
    if (channelIdMatch) {
      const channelId = parseInt(channelIdMatch[1]);
      setActiveChannelId(channelId);
      
      // Find workspace for this channel from channels list
      const channel = channels.find(c => c.id === channelId);
      if (channel && channel.workspaceId) {
        setActiveWorkspaceId(channel.workspaceId);
        setStoreActiveWorkspaceId(channel.workspaceId);
      }
    } else {
      setActiveChannelId(null);
    }

    if (workspaceIdMatch) {
      const wsId = parseInt(workspaceIdMatch[1]);
      setActiveWorkspaceId(wsId);
      setStoreActiveWorkspaceId(wsId);
    }
  }, [location.pathname, channels]);

  useEffect(() => {
    if (activeWorkspaceId) {
      const fetchChannels = async () => {
        let res;
        try {
          if (sidebarMode === 'archive') {
            res = await channelService.getArchivedChannels(activeWorkspaceId);
          } else if (sidebarMode === 'trash') {
            res = await channelService.getDeletedChannels(activeWorkspaceId);
          } else {
            res = await channelService.getWorkspaceChannels(activeWorkspaceId);
          }
          setChannels(res.data.data || []);
        } catch (err) {
          console.error('Failed to fetch channels for mode:', sidebarMode, err);
          setChannels([]);
        }
      };
      fetchChannels();
    }
  }, [activeWorkspaceId, sidebarMode, setChannels]);

  useEffect(() => {
    if (activeChannelId) {
      userService.getChannelMembers(activeChannelId).then(res => {
        setChannelMembersList(Array.isArray(res?.data) ? res.data : []);
      }).catch(err => {
        console.warn('Failed to load channel members in sidebar:', err?.response?.status);
        setChannelMembersList([]);
      });
    } else {
      setChannelMembersList([]);
    }
  }, [activeChannelId]);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const usersResp = await userService.getSharedRoomUsers();
        if (mounted) {
          setSharedUsers(Array.isArray(usersResp?.data) ? usersResp.data : []);
        }
      } catch (e) {
        console.error('Failed to load sidebar data', e);
      }
    }
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [setSharedUsers]);

  const visibleDMs = sharedUsers.filter(u => u.id !== user?.id);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!activeWorkspaceId || !inviteEmail.trim()) return;
    try {
      await workspaceService.inviteToWorkspace(activeWorkspaceId, inviteEmail);
      setShowInviteModal(false);
      setInviteEmail('');
      alert('Invitation sent successfully! The user will receive a notification.');
    } catch (error) {
      console.error('Failed to send invitation:', error);
      const errorMsg = error.response?.data?.message || 'Failed to send invitation. Make sure the email is registered.';
      alert(errorMsg);
    }
  };

  const handlePermanentDelete = async (e, channelId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('PERMANENTLY delete this channel? This cannot be undone.')) return;
    try {
      await channelService.permanentlyDeleteChannel(channelId);
      setChannels(channels.filter(c => c.id !== channelId));
    } catch (err) {
      alert(err.response?.data?.message || 'Only the creator can permanently delete this channel.');
    }
  };

  const handleRestore = async (e, channelId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await channelService.restoreChannel(channelId);
      setChannels(channels.filter(c => c.id !== channelId));
      alert('Channel restored!');
    } catch (err) {
      alert('Failed to restore channel.');
    }
  };

  const activeWorkspace = workspaces.find(r => r.id === activeWorkspaceId);

  return (
    <>
      <aside className="flex w-full max-w-[var(--sidebar-width)] shrink-0 flex-col sidebar-gradient text-white md:w-[var(--sidebar-width)] border-r border-white/5">
        <div className="px-6 py-6 space-y-4">
          <div className="flex flex-col">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
              {sidebarMode === 'archive' ? 'Archive' : sidebarMode === 'trash' ? 'Trash' : 'Workspace'}
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <div>
                <div className="text-xl font-black tracking-tight text-white">
                  {sidebarMode === 'archive' ? 'Archived' : sidebarMode === 'trash' ? 'Deleted' : (activeWorkspace?.name || 'ByteChat')}
                </div>
              </div>
            </div>
          </div>

          {/* Search/Filter Bar */}
          <div className="relative group/search">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-white/30 group-focus-within/search:text-white/60 transition-smooth">
              <Users2 size={14} />
            </div>
            <input
              type="text"
              placeholder="Jump to..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/20 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-white placeholder:text-white/30 focus:outline-none focus:bg-black/40 focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-smooth shadow-inner"
            />
          </div>
        </div>

        <div className="scrollbar-thin flex-1 space-y-8 overflow-y-auto px-4 py-2">
          <section>
            <div className="mb-4 flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
              <span>{sidebarMode === 'archive' ? 'Archived Channels' : sidebarMode === 'trash' ? 'Trashed Channels' : 'Channels'}</span>
              {sidebarMode === 'channels' && (
                <button 
                  onClick={() => setIsCreateChannelModalOpen(true)}
                  className="hover:text-white transition-smooth p-1 hover:bg-white/10 rounded"
                  disabled={!activeWorkspaceId}
                >
                  <Plus size={14} />
                </button>
              )}
            </div>
            <div className="space-y-0.5">
              {channels
                .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((channel) => (
                  <SidebarLink
                    key={channel.id}
                    to={`/chat/channel/${channel.id}`}
                    isActive={activeChannelId === channel.id}
                    icon={channel.isPrivate || channel.private ? <Lock size={15} /> : <Hash size={15} />}
                    title={`${channel.name}${channel.isArchived || channel.archived ? ' (archived)' : ''}`}
                    subtitle={channel.description}
                    badge={channel.unreadCount > 0 ? channel.unreadCount : null}
                    isArchived={channel.isArchived || channel.archived}
                    isDeleted={channel.isDeleted || channel.deleted}
                    onRestore={(e) => handleRestore(e, channel.id)}
                    onPermanentDelete={(e) => handlePermanentDelete(e, channel.id)}
                    sidebarMode={sidebarMode}
                    isCreator={channel.createdBy?.id === user?.id}
                  />
                ))}
              {channels.length === 0 && activeWorkspaceId && (
                <p className="px-3 text-xs text-white/30 italic">No channels found</p>
              )}
              {channels.length === 0 && !activeWorkspaceId && (
                <p className="px-3 text-xs text-white/30 italic">Select a workspace</p>
              )}
            </div>
          </section>

          {sidebarMode === 'channels' && (
            <section>
              <div className="mb-4 flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
                <div className="flex items-center gap-2">
                  <MessageCircleMore size={14} />
                  Direct messages
                </div>
              </div>
              <div className="space-y-0.5">
                {visibleDMs
                  .filter(u => u.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((u) => (
                    <SidebarLink
                      key={u.id}
                      to={`/chat/dm/${u.id}`}
                      isActive={location.pathname === `/chat/dm/${u.id}`}
                      icon={
                        <div className="relative flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-[10px] font-extrabold overflow-hidden border border-white/5 shadow-sm">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.displayName} className="h-full w-full object-cover" />
                          ) : (
                            u.displayName?.[0]?.toUpperCase() ?? 'U'
                          )}
                          <span className={`absolute bottom-0.5 right-0.5 h-1.5 w-1.5 rounded-full border border-[#2c0b2d] ${u.online ? 'bg-[#2bac76]' : 'bg-white/30'} ${u.online ? 'presence-dot' : ''}`} />
                        </div>
                      }
                      title={u.displayName}
                      subtitle={u.online ? 'Online' : 'Offline'}
                      badge={u.unreadCount > 0 ? u.unreadCount : null}
                      sidebarMode={sidebarMode}
                    />
                  ))}
                {visibleDMs.length === 0 && (
                  <p className="px-2 py-1 text-xs text-white/30 italic">No teammates yet.</p>
                )}
              </div>
            </section>
          )}
          
          <div className="mt-auto px-4 pb-6">
             <button 
               onClick={() => setShowInviteModal(true)}
               className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/60 transition-smooth hover:bg-white/10 hover:text-white group border border-white/5"
             >
               <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-smooth group-hover:bg-white/10 group-hover:scale-105">
                 <Users2 size={15} />
               </div>
               Invite Members
             </button>
          </div>
        </div>
      </aside>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-[#2c0b2d] p-8 rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-extrabold text-white tracking-tight">Invite Team</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-white/40 hover:text-white transition-smooth p-1">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleInviteMember} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/30 ml-1">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teammate@company.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/10 transition-smooth"
                  required
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-white text-[#3f0e40] font-bold py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-smooth shadow-lg"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const SidebarLink = ({ to, isActive, icon, title, subtitle, badge, isArchived, isDeleted, onRestore, onPermanentDelete, sidebarMode = 'channels', isCreator }) => (
  <div className="group relative flex items-center px-2">
    <NavLink
      to={sidebarMode === 'channels' ? to : '#'}
      onClick={(e) => sidebarMode !== 'channels' && e.preventDefault()}
      className={`flex flex-1 items-start gap-3.5 px-3 py-2.5 rounded-xl transition-smooth ${isActive ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10' : 'text-white/60 hover:bg-white/5 hover:text-white/90'
        } ${isArchived || isDeleted ? 'opacity-40' : ''}`}
    >
      <div className={`mt-0.5 shrink-0 ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white/80'}`}>{icon}</div>
      <div className="min-w-0 flex-1">
            <div className={`truncate text-sm font-bold tracking-tight ${isDeleted ? 'line-through text-red-300' : ''}`}>{title}</div>
            {subtitle && <div className="truncate text-[11px] font-bold text-white/30 group-hover:text-white/40 mt-0.5 transition-smooth">{subtitle}</div>}
          </div>
          {badge && (
            <div className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-sm ring-2 ring-[#2c0b2d]">
              {badge > 99 ? '99+' : badge}
            </div>
          )}
        </NavLink>
    
    {(sidebarMode === 'archive' || sidebarMode === 'trash') && (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={onRestore}
          className="p-1 hover:bg-white/20 rounded transition-colors" 
          title="Restore"
        >
          <Plus size={16} />
        </button>
        {sidebarMode === 'trash' && isCreator && (
          <button 
            onClick={onPermanentDelete}
            className="p-1 hover:bg-red-500/30 text-red-400 rounded transition-colors"
            title="Permanently Delete"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    )}
  </div>
);

export default Sidebar;
