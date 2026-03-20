import { Camera, Mail, Save, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import notificationService from '../../services/notificationService';
import userService from '../../services/userService';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import useToastStore from '../../store/toastStore';

const ProfileDrawer = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuthStore();
  const { onlineUsers, setOnlineUsers, notifications, setNotifications } = useChatStore();
  const { addToast } = useToastStore();
  const [form, setForm] = useState({
    displayName: user?.displayName ?? '',
    avatarUrl: user?.avatarUrl ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProfileData();
      setForm({
        displayName: user?.displayName ?? '',
        avatarUrl: user?.avatarUrl ?? '',
      });
      setIsEditing(false);
    }
  }, [isOpen, user]);

  async function loadProfileData() {
    try {
      const [onlineRes, notificationsRes] = await Promise.all([
        userService.getOnlineUsers(),
        notificationService.getNotifications(),
      ]);
      setOnlineUsers(onlineRes.data ?? []);
      setNotifications(notificationsRes.data ?? []);
    } catch (error) {
      console.error('Failed to load profile data', error);
    }
  }

  async function handleSave() {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    try {
      setSaving(true);
      const response = await userService.updateCurrentUser({
        displayName: form.displayName,
        avatarUrl: form.avatarUrl,
      });
      updateUser(response.data);
      setIsEditing(false);
      addToast('Profile updated successfully', 'success');
    } catch (error) {
      addToast(error.response?.data?.message ?? 'Unable to update profile', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const response = await userService.updateAvatar(file);
      updateUser(response.data);
      setForm((prev) => ({ ...prev, avatarUrl: response.data.avatarUrl }));
      addToast('Avatar updated', 'success');
    } catch (error) {
      addToast(error.response?.data?.message ?? 'Logo upload failed', 'error');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={`fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) border-l border-gray-100 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-5 border-b border-gray-50 bg-white">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#2c0b2e]/5 rounded-lg text-[#2c0b2e]">
              <UserRound size={18} strokeWidth={3} />
            </div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Profile Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="flex h-32 w-32 items-center justify-center bg-gradient-to-br from-[#2c0b2e] to-[#1a061b] text-4xl font-black text-white overflow-hidden shadow-2xl rounded-full transition-transform duration-500 group-hover:scale-105 ring-4 ring-white">
                {form.avatarUrl ? (
                  <img src={form.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  form.displayName?.[0]?.toUpperCase() ?? 'U'
                )}
              </div>
              <label 
                className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-sm"
              >
                <input
                  type="file"
                  className="hidden"
                  onChange={handleAvatarChange}
                  accept="image/*"
                  disabled={uploading}
                />
                {uploading ? (
                  <div className="h-6 w-6 animate-spin border-2 border-white border-t-transparent" />
                ) : (
                  <Camera size={24} strokeWidth={2.5} />
                )}
              </label>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#2bac76] border-4 border-white shadow-lg" />
            </div>
            <h3 className="mt-4 text-xl font-black text-gray-900">Welcome ByteChat</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Profile settings</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="block">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#6b6a6b] ml-1">Display Name</span>
                <div className="mt-2 relative flex h-12 items-center gap-3 rounded-xl bg-[#fafafa] px-4 border border-black/5 focus-within:bg-white focus-within:border-[#2c0b2e]/30 transition-all">
                  <UserRound size={16} className="text-[#2c0b2e]/40" />
                  <input
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    disabled={!isEditing}
                    className="w-full bg-transparent text-sm font-bold text-[#1d1c1d] outline-none placeholder:text-gray-300"
                    placeholder="New display name"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#6b6a6b] ml-1">Mail</span>
                <div className="mt-2 relative flex h-12 items-center gap-3 rounded-xl bg-[#fafafa] px-4 border border-black/5 focus-within:bg-white focus-within:border-[#2c0b2e]/30 transition-all">
                  <Mail size={16} className="text-[#2c0b2e]/40" />
                  <input
                    value={user?.email ?? ''}
                    disabled
                    className="w-full bg-transparent text-sm font-bold text-[#1d1c1d] outline-none placeholder:text-gray-300"
                    placeholder="Mail"
                  />
                </div>
              </label>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-14 bg-[#2c0b2e] text-white rounded-xl font-black tracking-wide text-sm flex items-center justify-center gap-2 hover:bg-[#1a061b] transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? (
                <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Save size={18} strokeWidth={2.5} />
              )}
              {saving ? 'UPDATING...' : isEditing ? 'SAVE CHANGES' : 'UPDATE PROFILE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDrawer;
