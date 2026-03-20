import { X, UserMinus, User, Calendar, Users, MoreVertical } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import useAuthStore from '../../store/authStore';
import groupDmService from '../../services/groupDmService';
import useToastStore from '../../store/toastStore';
import Modal from '../Shared/Modal';

const GroupInfoDrawer = ({ isOpen, onClose, group, onMemberRemoved }) => {
  const currentUser = useAuthStore((state) => state.user);
  const { addToast } = useToastStore();
  const [activeMenu, setActiveMenu] = useState(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const menuRef = useRef(null);

  const members = group?.members || [];
  const isCreator = String(group?.createdBy?.id) === String(currentUser?.id);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRemove = (member) => {
    setRemoveTarget(member);
    setShowRemoveConfirm(true);
  };

  const confirmRemove = async () => {
    if (!removeTarget || !group?.id) {
      return;
    }

    try {
      await groupDmService.removeMember(group.id, removeTarget.id);
      onMemberRemoved?.(removeTarget.id);
      addToast('Member removed', 'success');
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to remove member', 'error');
    } finally {
      setShowRemoveConfirm(false);
      setRemoveTarget(null);
    }
  };

  return (
    <div className={`fixed inset-y-0 right-0 z-50 w-80 transform border-l border-gray-100 bg-white shadow-2xl transition-transform duration-500 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-gray-50 px-6 py-5">
          <h2 className="text-lg font-black tracking-tight text-gray-900">Group Info</h2>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900">
            <X size={20} />
          </button>
        </header>

        <div className="scrollbar-thin flex-1 overflow-y-auto">
          <div className="border-b border-gray-50 bg-gray-50/30 p-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#3f0e40]/10 text-[#3f0e40] shadow-inner">
              <Users size={32} strokeWidth={2.5} />
            </div>
            <h3 className="truncate text-xl font-black text-gray-900">{group?.name}</h3>
          </div>

          <div className="space-y-4 px-6 py-6">
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-gray-500">Created on {group?.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <User size={16} className="text-gray-400" />
              <span>
                Created by <span className="font-bold text-gray-700">{group?.createdBy?.displayName || 'Unknown'}</span>
              </span>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Members • {members.length}</span>
            </div>

            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="group flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/5 bg-[#3f0e40]/5">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.displayName} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-sm font-black text-[#3f0e40]/60">{member.displayName?.[0] || 'U'}</span>
                        )}
                      </div>
                      {member.online && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#2bac76]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-gray-900">{member.displayName}</div>
                      <div className="truncate text-[10px] font-bold text-gray-400">{member.email}</div>
                    </div>
                  </div>

                  <div className="relative flex items-center gap-2">
                    {member.id === currentUser?.id && (
                      <span className="rounded-full bg-[#3f0e40]/10 px-2 py-0.5 text-[10px] font-black text-[#3f0e40]">YOU</span>
                    )}

                    {isCreator && member.id !== currentUser?.id && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === member.id ? null : member.id);
                          }}
                          className={`rounded-lg p-2 transition-all ${activeMenu === member.id ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'}`}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {activeMenu === member.id && (
                          <div ref={menuRef} className="absolute right-0 top-full z-[60] mt-1 w-48 border border-black/5 bg-white py-1.5 shadow-xl">
                            <button
                              type="button"
                              onClick={() => {
                                handleRemove(member);
                                setActiveMenu(null);
                              }}
                              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
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

        <Modal
          isOpen={showRemoveConfirm}
          onClose={() => setShowRemoveConfirm(false)}
          title="Remove Member"
          rounded="rounded-none"
        >
          <div className="p-1">
            <p className="mb-8 text-sm leading-relaxed text-gray-500">
              Are you sure you want to remove {removeTarget?.displayName} from {group?.name}?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowRemoveConfirm(false)}
                className="flex-1 border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemove}
                className="flex-1 bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-700"
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

export default GroupInfoDrawer;
