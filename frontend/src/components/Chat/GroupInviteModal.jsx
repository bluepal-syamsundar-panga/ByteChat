import { useEffect, useMemo, useState } from 'react';
import workspaceService from '../../services/workspaceService';
import groupDmService from '../../services/groupDmService';
import Modal from '../Shared/Modal';
import useToastStore from '../../store/toastStore';

const GroupInviteModal = ({ isOpen, onClose, group }) => {
  const { addToast } = useToastStore();
  const [members, setMembers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const existingMemberIds = useMemo(
    () => new Set((group?.members || []).map((member) => String(member.id))),
    [group?.members]
  );

  useEffect(() => {
    if (!isOpen || !group?.workspaceId) {
      return;
    }

    let mounted = true;
    setLoading(true);
    workspaceService.getWorkspaceMembers(group.workspaceId)
      .then((resp) => {
        const data = resp.data?.data || resp.data || [];
        if (!mounted) {
          return;
        }
        setMembers(
          (Array.isArray(data) ? data : []).filter((member) => !existingMemberIds.has(String(member.id)))
        );
      })
      .catch((error) => {
        console.error('Failed to load workspace members for group invite', error);
        addToast('Failed to load workspace members', 'error');
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, group?.workspaceId, existingMemberIds, addToast]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds([]);
    }
  }, [isOpen]);

  const toggleMember = (memberId) => {
    setSelectedIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSubmit = async () => {
    if (!group?.id || selectedIds.length === 0) {
      return;
    }

    setSubmitting(true);
    try {
      await groupDmService.inviteMembers(group.id, selectedIds);
      addToast('Group invitations sent', 'success');
      onClose(true);
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to invite members', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => onClose(false)} title="Invite to Group" rounded="rounded-none">
      <div className="space-y-4">
        <div className="text-sm text-[#6b6a6b]">
          Invite workspace members to <span className="font-semibold text-[#1d1c1d]">{group?.name}</span>.
        </div>

        <div className="max-h-72 overflow-y-auto space-y-2 scrollbar-thin">
          {loading ? (
            <div className="py-8 text-center text-sm text-[#6b6a6b]">Loading workspace members...</div>
          ) : members.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#6b6a6b]">No more workspace members to invite</div>
          ) : (
            members.map((member) => {
              const isSelected = selectedIds.includes(member.id);
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleMember(member.id)}
                  className={`flex w-full items-center justify-between p-2 transition ${
                    isSelected ? 'bg-[#3f0e40]/10' : 'hover:bg-black/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden bg-[#3f0e40] font-bold text-white">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.displayName} className="h-full w-full object-cover" />
                      ) : (
                        member.displayName?.[0]?.toUpperCase() ?? 'U'
                      )}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-[#1d1c1d]">{member.displayName}</div>
                      <div className="text-xs text-[#6b6a6b]">{member.email}</div>
                    </div>
                  </div>
                  <div className={`h-4 w-4 border ${isSelected ? 'border-[#3f0e40] bg-[#3f0e40]' : 'border-black/20'}`} />
                </button>
              );
            })
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || selectedIds.length === 0}
          className="w-full bg-[#3f0e40] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#350d36] disabled:opacity-50"
        >
          {submitting ? 'Inviting...' : 'Send invites'}
        </button>
      </div>
    </Modal>
  );
};

export default GroupInviteModal;
