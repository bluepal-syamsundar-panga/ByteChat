import { useState, useEffect } from 'react';
import { Search, UserPlus, Loader2, Check } from 'lucide-react';
import Modal from '../Shared/Modal';
import workspaceService from '../../services/workspaceService';
import channelService from '../../services/channelService';
import useToastStore from '../../store/toastStore';
import useAuthStore from '../../store/authStore';

const ChannelInviteModal = ({ isOpen, onClose, channelId, workspaceId, channelName }) => {
    const [members, setMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [invitingEmails, setInvitingEmails] = useState(new Set());
    const addToast = useToastStore((state) => state.addToast);
    const currentUser = useAuthStore((state) => state.user);

    useEffect(() => {
        if (isOpen && workspaceId) {
            loadWorkspaceMembers();
        }
    }, [isOpen, workspaceId]);

    const loadWorkspaceMembers = async () => {
        setLoading(true);
        try {
            const res = await workspaceService.getWorkspaceMembers(workspaceId);
            setMembers(res.data.data || []);
        } catch (err) {
            console.error('Failed to load workspace members', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (email) => {
        if (invitingEmails.has(email)) return;
        
        setInvitingEmails(prev => new Set(prev).add(email));
        try {
            await channelService.inviteUser(channelId, email);
            addToast(`Invitation sent to ${email}`, 'success');
        } catch (err) {
            console.error('Failed to invite user', err);
            addToast(err.response?.data?.message || 'Failed to send invitation', 'error');
            setInvitingEmails(prev => {
                const next = new Set(prev);
                next.delete(email);
                return next;
            });
        }
    };

    const normalizedQuery = searchQuery.toLowerCase();
    const filteredMembers = members.filter((member) => {
        const isCurrentUser =
            String(member.id) === String(currentUser?.id) ||
            String(member.email).toLowerCase() === String(currentUser?.email).toLowerCase();

        if (isCurrentUser) {
            return false;
        }

        return (
            member.displayName?.toLowerCase().includes(normalizedQuery) ||
            member.email?.toLowerCase().includes(normalizedQuery)
        );
    });

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`Invite to #${channelName}`}
            rounded="rounded-none"
        >
            <div className="space-y-4">
                <div className="relative group/search">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/search:text-indigo-500 transition-smooth" size={18} />
                    <input
                        type="text"
                        placeholder="Search workspace members..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full border border-gray-100 bg-gray-50/50 rounded-2xl pl-11 pr-5 py-3.5 text-sm font-medium focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 outline-none transition-smooth shadow-inner"
                        autoFocus
                    />
                </div>

                <div className="max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-[#6b6a6b]">
                            <Loader2 className="animate-spin mb-2" size={24} />
                            <p className="text-sm">Loading members...</p>
                        </div>
                    ) : filteredMembers.length === 0 ? (
                        <div className="py-12 text-center text-[#6b6a6b]">
                            <p className="text-sm">No members found in this workspace.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredMembers.map((member) => {
                                const isInvited = invitingEmails.has(member.email);
                                return (
                                    <div 
                                        key={member.id}
                                        className="flex items-center justify-between p-2 rounded-md hover:bg-black/5 transition-colors group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 font-bold text-base overflow-hidden shadow-sm transition-smooth group-hover:scale-105">
                                                {member.avatarUrl ? (
                                                    <img src={member.avatarUrl} alt={member.displayName} className="h-full w-full object-cover" />
                                                ) : (
                                                    member.displayName?.[0]?.toUpperCase() ?? 'U'
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold truncate text-gray-900">{member.displayName}</div>
                                                <div className="text-xs font-medium text-gray-400 truncate">{member.email}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleInvite(member.email)}
                                            disabled={isInvited}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-smooth shadow-sm ${
                                                isInvited 
                                                ? 'bg-green-50 text-green-600 ring-1 ring-green-100 cursor-default' 
                                                : 'bg-[#3f0e40] text-white hover:bg-[#350d36] hover:scale-105 active:scale-95'
                                            }`}
                                        >
                                            {isInvited ? (
                                                <>
                                                    <Check size={14} className="stroke-[3]" />
                                                    Invited
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus size={14} className="stroke-[2.5]" />
                                                    Invite
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ChannelInviteModal;
