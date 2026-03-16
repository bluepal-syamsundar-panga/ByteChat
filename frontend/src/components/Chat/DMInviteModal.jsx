import { Search, UserPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import userService from '../../services/userService';
import dmRequestService from '../../services/dmRequestService';
import Modal from '../Shared/Modal';

const DMInviteModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    
    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const resp = await userService.getUsers();
        // Simple client-side search for now
        const all = resp.data?.content || resp.data || [];
        setUsers(all.filter(u => 
          u.email.toLowerCase().includes(query.toLowerCase()) || 
          u.displayName.toLowerCase().includes(query.toLowerCase())
        ));
      } catch (e) {
        console.error('Search failed', e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, isOpen]);

  const handleInvite = async (userId) => {
    setSending({ ...sending, [userId]: true });
    try {
      await dmRequestService.sendRequest(userId);
      alert('Invitation sent successfully!');
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to send invitation');
    } finally {
      setSending({ ...sending, [userId]: false });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Start a Direct Message">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-[#6b6a6b]" size={18} />
          <input
            type="text"
            className="w-full bg-[#f8f8f8] border border-black/10 px-10 py-2.5 text-sm outline-none focus:border-[#3f0e40] transition"
            placeholder="Search by name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="max-h-60 overflow-y-auto scrollbar-thin space-y-2">
          {loading ? (
            <div className="py-8 text-center text-sm text-[#6b6a6b]">Searching...</div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#6b6a6b]">No users found for "{query}"</div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-2 hover:bg-black/5 rounded transition">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-[#3f0e40] flex items-center justify-center text-white font-bold rounded overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
                    ) : (
                      user.displayName[0].toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{user.displayName}</div>
                    <div className="text-xs text-[#6b6a6b]">{user.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleInvite(user.id)}
                  disabled={sending[user.id]}
                  className="flex items-center gap-1.5 bg-[#3f0e40] text-white px-3 py-1.5 text-xs font-semibold rounded hover:bg-[#350d36] transition disabled:opacity-50"
                >
                  <UserPlus size={14} />
                  {sending[user.id] ? 'Sending...' : 'Invite'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

export default DMInviteModal;
