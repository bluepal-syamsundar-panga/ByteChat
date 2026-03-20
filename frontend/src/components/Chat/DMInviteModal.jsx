import { useEffect, useMemo, useState } from 'react';
import workspaceService from '../../services/workspaceService';
import dmRequestService from '../../services/dmRequestService';
import groupDmService from '../../services/groupDmService';
import Modal from '../Shared/Modal';
import useToastStore from '../../store/toastStore';
import useChatStore from '../../store/chatStore';
import useAuthStore from '../../store/authStore';

const DMInviteModal = ({ isOpen, onClose, forceGroupMode = false }) => {
  const activeWorkspaceId = useChatStore((state) => state.activeWorkspaceId);
  const setGroupConversations = useChatStore((state) => state.setGroupConversations);
  const currentUser = useAuthStore((state) => state.user);
  const { addToast } = useToastStore();
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !activeWorkspaceId) return;
    let mounted = true;
    setLoading(true);
    workspaceService.getWorkspaceMembers(activeWorkspaceId)
      .then((resp) => {
        const data = resp.data?.data || resp.data || [];
        if (mounted) {
          setMembers(Array.isArray(data) ? data.filter((member) => String(member.id) !== String(currentUser?.id)) : []);
        }
      })
      .catch((error) => {
        console.error('Failed to load workspace members', error);
        addToast('Failed to load workspace members', 'error');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, activeWorkspaceId, currentUser?.id, addToast]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIds([]);
      setGroupName('');
    }
  }, [isOpen]);

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return members.filter((member) =>
      member.displayName?.toLowerCase().includes(normalizedQuery) ||
      member.email?.toLowerCase().includes(normalizedQuery)
    );
  }, [members, query]);

  const isGroupMode = forceGroupMode || selectedIds.length > 1;

  const toggleMember = (memberId) => {
    setSelectedIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSubmit = async () => {
    if (!activeWorkspaceId || selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      if (!forceGroupMode && selectedIds.length === 1) {
        await dmRequestService.sendRequest(activeWorkspaceId, selectedIds[0]);
        addToast('Direct message invitation sent', 'success');
      } else {
        const response = await groupDmService.createGroup(
          activeWorkspaceId,
          groupName.trim() || 'New group',
          selectedIds
        );
        const createdGroup = response.data || response;
        setGroupConversations((prev) => [createdGroup, ...prev]);
        addToast('Group created and invitations sent', 'success');
      }
      onClose();
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to complete invite action', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Start a chat" rounded="rounded-none">
      <div className="space-y-4">
        {!activeWorkspaceId ? (
          <div className="py-6 text-center text-sm text-[#6b6a6b]">Select a workspace first.</div>
        ) : (
          <>
            <div className="relative">
              <input
                type="text"
                className="w-full bg-[#f8f8f8] border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-[#3f0e40] transition"
                placeholder="Search workspace members"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>

            {isGroupMode && (
              <input
                type="text"
                className="w-full bg-[#f8f8f8] border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-[#3f0e40] transition"
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            )}

            <div className="max-h-72 overflow-y-auto scrollbar-thin space-y-2">
              {loading ? (
                <div className="py-8 text-center text-sm text-[#6b6a6b]">Loading workspace members...</div>
              ) : filteredMembers.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#6b6a6b]">No workspace members found</div>
              ) : (
                filteredMembers.map((member) => {
                  const isSelected = selectedIds.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleMember(member.id)}
                      className={`flex w-full items-center justify-between p-2 rounded transition ${
                        isSelected ? 'bg-[#3f0e40]/10' : 'hover:bg-black/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-[#3f0e40] flex items-center justify-center text-white font-bold rounded overflow-hidden">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.displayName} className="h-full w-full object-cover" />
                          ) : (
                            member.displayName?.[0]?.toUpperCase() ?? 'U'
                          )}
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-semibold">{member.displayName}</div>
                          <div className="text-xs text-[#6b6a6b]">{member.email}</div>
                        </div>
                      </div>
                      <div className={`h-4 w-4 border ${isSelected ? 'bg-[#3f0e40] border-[#3f0e40]' : 'border-black/20'}`} />
                    </button>
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || selectedIds.length === 0 || (isGroupMode && (!groupName.trim() || selectedIds.length < 2))}
              className="w-full bg-[#3f0e40] text-white px-4 py-3 text-sm font-semibold hover:bg-[#350d36] transition disabled:opacity-50"
            >
              {submitting ? 'Working...' : isGroupMode ? 'Create group chat' : 'Send direct message invite'}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default DMInviteModal;
