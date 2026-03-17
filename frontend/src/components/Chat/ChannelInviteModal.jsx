import { useState, useEffect } from 'react';
import { Search, UserPlus, X, Loader2, Check } from 'lucide-react';
import Modal from '../Shared/Modal';
import workspaceService from '../../services/workspaceService';
import channelService from '../../services/channelService';
import useToastStore from '../../store/toastStore';

const ChannelInviteModal = ({ isOpen, onClose, channelId, workspaceId, channelName }) => {
    const [members, setMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [invitingEmails, setInvitingEmails] = useState(new Set());
    const addToast = useToastStore((state) => state.addToast);

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

    const filteredMembers = members.filter(m => 
        m.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`Invite members to #${channelName}`}
        >
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6a6b]" size={18} />
                    <input
                        type="text"
                        placeholder="Search workspace members..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full border border-black/10 bg-[#f8f8f8] pl-10 pr-4 py-2.5 text-sm focus:border-[#3f0e40] focus:ring-1 focus:ring-[#3f0e40] outline-none transition-all"
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
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center bg-[#3f0e40]/10 text-[#3f0e40] font-bold text-sm overflow-hidden">
                                                {member.avatarUrl ? (
                                                    <img src={member.avatarUrl} alt={member.displayName} className="h-full w-full object-cover" />
                                                ) : (
                                                    member.displayName?.[0]?.toUpperCase() ?? 'U'
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-semibold truncate text-[#1d1c1d]">{member.displayName}</div>
                                                <div className="text-xs text-[#6b6a6b] truncate">{member.email}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleInvite(member.email)}
                                            disabled={isInvited}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                                                isInvited 
                                                ? 'bg-[#2bac76]/10 text-[#2bac76] cursor-default' 
                                                : 'bg-[#3f0e40] text-white hover:bg-[#350d36]'
                                            }`}
                                        >
                                            {isInvited ? (
                                                <>
                                                    <Check size={14} />
                                                    Invited
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus size={14} />
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
