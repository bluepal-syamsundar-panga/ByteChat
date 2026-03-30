import { useState } from 'react';
import { X } from 'lucide-react';
import useChatStore from '../../store/chatStore';
import channelService from '../../services/channelService';
import useToastStore from '../../store/toastStore';
import UnsavedChangesModal from '../Shared/UnsavedChangesModal';

const CreateChannelModal = () => {
    const { 
        isCreateChannelModalOpen, 
        setIsCreateChannelModalOpen, 
        activeWorkspaceId, 
        channels,
        sidebarChannels,
        setChannels,
        setSidebarChannels,
    } = useChatStore();
    const { addToast } = useToastStore();
    
    const [newChannelName, setNewChannelName] = useState('');
    const [newChannelDesc, setNewChannelDesc] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showDiscardWarning, setShowDiscardWarning] = useState(false);

    if (!isCreateChannelModalOpen) return null;

    const hasUnsavedChanges = Boolean(newChannelName.trim() || newChannelDesc.trim() || isPrivate);

    const closeModal = () => {
        setIsCreateChannelModalOpen(false);
        setNewChannelName('');
        setNewChannelDesc('');
        setIsPrivate(false);
        setShowDiscardWarning(false);
    };

    const requestClose = () => {
        if (hasUnsavedChanges) {
            setShowDiscardWarning(true);
            return;
        }
        closeModal();
    };

    const handleCreateChannel = async (e) => {
        e.preventDefault();
        if (!activeWorkspaceId || !newChannelName.trim()) return;
        
        setLoading(true);
        try {
            const res = await channelService.createChannel(activeWorkspaceId, newChannelName, newChannelDesc, isPrivate);
            const createdChannel = res?.data?.data ?? res?.data ?? res;
            setChannels([...(channels || []), createdChannel]);
            setSidebarChannels([...(sidebarChannels || []), createdChannel]);
            addToast('Channel created successfully!', 'success');
            closeModal();
        } catch (err) {
            console.error('Failed to create channel', err);
            addToast('Failed to create channel.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    requestClose();
                }
            }}
        >
            <div className="w-full max-w-md bg-[#3f0e40] p-8 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 rounded-none text-white" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Create a channel</h2>
                    <button 
                        onClick={requestClose} 
                        className="text-white/60 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
                <p className="text-white/60 text-sm mb-6">
                    Channels are where your team communicates. They’re best when organized around a topic — #marketing, for example.
                </p>
                <form onSubmit={handleCreateChannel} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Name</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-lg">#</span>
                            <input
                                type="text"
                                value={newChannelName}
                                onChange={(e) => setNewChannelName(e.target.value)}
                                placeholder="e.g. plan-budget"
                                className="w-full bg-white/5 border border-white/10 px-8 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                                required
                                autoFocus
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Description (optional)</label>
                        <input
                            type="text"
                            value={newChannelDesc}
                            onChange={(e) => setNewChannelDesc(e.target.value)}
                            placeholder="What’s this channel about?"
                            className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                        />
                    </div>

                    <div className="pt-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={isPrivate}
                                    onChange={(e) => setIsPrivate(e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={`w-10 h-5 rounded-full transition-colors ${isPrivate ? 'bg-[#2bac76]' : 'bg-white/20'} group-hover:bg-opacity-80`}></div>
                                <div className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${isPrivate ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </div>
                            <span className="text-sm font-medium text-white/90">Make Private</span>
                        </label>
                        <p className="mt-1 text-xs text-white/50">
                            {isPrivate 
                                ? 'Only invited members will be able to see and join this channel.' 
                                : 'Anyone in the workspace will be able to see and join this channel.'}
                        </p>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading || !newChannelName.trim()}
                            className="w-full bg-white text-[#3f0e40] font-bold py-3 hover:bg-white/90 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
            <UnsavedChangesModal
                isOpen={showDiscardWarning}
                onCancel={() => setShowDiscardWarning(false)}
                onConfirm={closeModal}
            />
        </div>
    );
};

export default CreateChannelModal;
