import { X, UserMinus, Shield, User, Calendar, Hash, Lock, MoreVertical } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import channelService from '../../services/channelService';
import { useState, useRef, useEffect, useMemo } from 'react';
import useToastStore from '../../store/toastStore';
import Modal from '../Shared/Modal';

const ChannelInfoDrawer = ({ isOpen, onClose, channel, members, onMemberRemoved, onMemberPromoted, onMemberDemoted, isWorkspaceOwner }) => {
  const currentUser = useAuthStore((state) => state.user);
  const [activeMenu, setActiveMenu] = useState(null);
  const { addToast } = useToastStore();
  const menuRef = useRef(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [showMakeAdminConfirm, setShowMakeAdminConfirm] = useState(false);
  const [makeAdminTarget, setMakeAdminTarget] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const isChannelAdmin = channel?.role === 'ADMIN';
  const sortedMembers = useMemo(() => {
    const memberList = Array.isArray(members) ? [...members] : [];

    return memberList.sort((left, right) => {
      const leftIsAdmin = left?.role === 'ADMIN';
      const rightIsAdmin = right?.role === 'ADMIN';

      if (leftIsAdmin !== rightIsAdmin) {
        return leftIsAdmin ? -1 : 1;
      }

      return (left?.displayName || '').localeCompare(right?.displayName || '', undefined, {
        sensitivity: 'base',
      });
    });
  }, [members]);

  const handleRemove = async (userId, displayName) => {
    const isDefault = channel?.isDefault || channel?.name === 'general';
    let msg = `Are you sure you want to remove ${displayName} from #${channel?.name}?`;
    
    if (isDefault && isWorkspaceOwner) {
      msg = `CRITICAL: Removing a member from the default channel (#${channel?.name}) will also remove them from the entire WORKSPACE. Proceed removing ${displayName}?`;
    }

    setRemoveTarget({ userId, displayName, msg });
    setShowRemoveConfirm(true);
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    const { userId } = removeTarget;
    try {
      await channelService.removeMember(channel.id, userId);
      onMemberRemoved(userId);
      addToast('Member removed', 'success');
    } catch (error) {
      console.error('Failed to remove member:', error);
      addToast(error.response?.data?.message || 'Failed to remove member', 'error');
    } finally {
      setShowRemoveConfirm(false);
      setRemoveTarget(null);
    }
  };

  const handleMakeAdmin = (userId, displayName) => {
    setMakeAdminTarget({ userId, displayName });
    setShowMakeAdminConfirm(true);
    setActiveMenu(null);
  };

  const confirmMakeAdmin = async () => {
    if (!makeAdminTarget) return;

    try {
      await channelService.makeAdmin(channel.id, makeAdminTarget.userId);
      onMemberPromoted?.(makeAdminTarget.userId);
      addToast('Member promoted to admin', 'success');
    } catch (error) {
      console.error('Failed to promote member:', error);
      addToast(error.response?.data?.message || 'Failed to make member admin', 'error');
    } finally {
      setShowMakeAdminConfirm(false);
      setMakeAdminTarget(null);
    }
  };

  const handleRemoveAdmin = async (userId) => {
    try {
      await channelService.removeAdmin(channel.id, userId);
      onMemberDemoted?.(userId);
      setActiveMenu(null);
      addToast('Admin access removed', 'success');
    } catch (error) {
      console.error('Failed to remove admin:', error);
      addToast(error.response?.data?.message || 'Failed to remove admin access', 'error');
    }
  };

  return (
    <div className={`fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) border-l border-gray-100 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
          <h2 className="text-lg font-black text-gray-900 tracking-tight">Channel Info</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* Channel Hero Section */}
          <div className="p-6 text-center border-b border-gray-50 bg-gray-50/30">
            <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#3f0e40]/10 text-[#3f0e40] shadow-inner`}>
              {(channel?.isPrivate || channel?.private) ? (
                <Lock size={32} strokeWidth={2.5} />
              ) : (
                <Hash size={32} strokeWidth={2.5} />
              )}
            </div>
            <h3 className="text-xl font-black text-gray-900 truncate">#{channel?.name}</h3>
            {channel?.description && (
              <p className="mt-2 text-sm text-gray-500 font-medium leading-relaxed italic px-2">
                "{channel.description}"
              </p>
            )}
          </div>

          {/* Details */}
          <div className="px-6 py-6 space-y-4">
             <div className="flex items-center gap-3 text-sm">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-gray-500">Created on {new Date(channel?.createdAt).toLocaleDateString()}</span>
             </div>
             <div className="flex items-center gap-3 text-sm text-gray-500">
                <User size={16} className="text-gray-400" />
                <span>Created by <span className="font-bold text-gray-700">{channel?.createdBy?.displayName || 'Unknown'}</span></span>
             </div>
          </div>

          {/* Members List */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Members • {members.length}</span>
            </div>
            
            <div className="space-y-3">
              {sortedMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-[#3f0e40]/5 border border-black/5 flex items-center justify-center overflow-hidden shrink-0">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.displayName} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[#3f0e40]/60 font-black text-sm">{member.displayName?.[0] || 'U'}</span>
                          )}
                        </div>
                        {member.online && (
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#2bac76] border-2 border-white" />
                        )}
                    </div>
                    <div className="min-w-0 relative">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-gray-900 truncate max-w-[120px]">{member.displayName}</span>
                        {member.role === 'ADMIN' && (
                          <Shield size={10} className="text-amber-500 fill-amber-500/20" />
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 font-bold truncate">{member.email}</div>
                      <div className="pointer-events-none absolute left-0 top-full z-10 mt-1 whitespace-nowrap rounded-lg bg-[#1d1c1d] px-2.5 py-1.5 text-[10px] font-bold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                        {formatPresenceTooltip(member)}
                      </div>
                    </div>
                  </div>

                  <div className="relative flex items-center gap-2">
                    {member.id === currentUser?.id && (
                      <span className="text-[10px] font-black text-[#3f0e40] bg-[#3f0e40]/10 px-2 py-0.5 rounded-full">YOU</span>
                    )}
                    
                    {isChannelAdmin && member.id !== currentUser?.id && (
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === member.id ? null : member.id);
                          }}
                          className={`p-2 rounded-lg transition-all ${activeMenu === member.id ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {activeMenu === member.id && (
                          <div 
                            ref={menuRef}
                            className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-black/5 z-[60] py-1.5 animate-in fade-in zoom-in-95 duration-200"
                          >
                            {member.role !== 'ADMIN' && (
                              <button
                                onClick={() => handleMakeAdmin(member.id, member.displayName)}
                                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 transition-colors font-medium"
                              >
                                <Shield size={16} />
                                Make Admin
                              </button>
                            )}
                            {member.role === 'ADMIN' && (
                              <button
                                onClick={() => handleRemoveAdmin(member.id)}
                                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                              >
                                <Shield size={16} />
                                Remove as Admin
                              </button>
                            )}
                            <button
                              onClick={() => {
                                handleRemove(member.id, member.displayName);
                                setActiveMenu(null);
                              }}
                              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                            >
                              <UserMinus size={16} />
                              Remove Member
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
      {/* Remove Member Confirmation Modal */}
      <Modal
        isOpen={showMakeAdminConfirm}
        onClose={() => {
          setShowMakeAdminConfirm(false);
          setMakeAdminTarget(null);
        }}
        title="Make Admin"
        rounded="rounded-none"
      >
        <div className="p-1">
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Are you sure you want to make <span className="font-bold text-gray-700">{makeAdminTarget?.displayName}</span> an admin in <span className="font-bold text-gray-700">#{channel?.name}</span>?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowMakeAdminConfirm(false);
                setMakeAdminTarget(null);
              }}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-none text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmMakeAdmin}
              className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-none font-bold text-sm hover:bg-amber-600 transition-all shadow-md active:scale-95"
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        title="Remove Member"
        rounded="rounded-none"
      >
        <div className="p-1">
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            {removeTarget?.msg}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowRemoveConfirm(false)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-none text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmRemove}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-none font-bold text-sm hover:bg-red-700 transition-all shadow-md active:scale-95"
            >
              Remove
            </button>
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
};

function formatPresenceTooltip(member) {
  if (member?.online) {
    return 'Online';
  }

  const lastSeen = normalizePresenceDate(member?.lastSeen);
  if (!lastSeen) {
    return 'Last seen unavailable';
  }

  return `Last seen ${lastSeen.toLocaleString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

function normalizePresenceDate(value) {
  if (!value) return null;
  if (Array.isArray(value) && value.length >= 6) {
    const date = new Date(value[0], value[1] - 1, value[2], value[3], value[4], value[5]);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default ChannelInfoDrawer;
