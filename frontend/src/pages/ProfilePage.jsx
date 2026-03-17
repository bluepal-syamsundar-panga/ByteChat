import { Camera, Save, UserRound, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import notificationService from '../services/notificationService';
import userService from '../services/userService';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';

const ProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const { onlineUsers, setOnlineUsers, notifications, setNotifications } = useChatStore();
  const [form, setForm] = useState({
    displayName: user?.displayName ?? '',
    avatarUrl: user?.avatarUrl ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

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
    try {
      setSaving(true);
      const response = await userService.updateCurrentUser(form);
      updateUser(response.data);
    } catch (error) {
      window.alert(error.response?.data?.message ?? 'Unable to update profile');
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
    } catch (error) {
      window.alert(error.response?.data?.message ?? 'Logo upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleMarkNotification(notificationId) {
    await notificationService.markAsRead(notificationId);
    setNotifications(
      notifications.map((item) =>
        item.id === notificationId ? { ...item, isRead: true } : item,
      ),
    );
  }

  return (
    <div className="flex h-full min-h-0 items-center justify-center bg-[#fafafa]/50 p-6">
      <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-500">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#2c0b2e]/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#2c0b2e]">
            <UserRound size={12} strokeWidth={3} />
            User Settings
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-[#1d1c1d]">Profile Identity</h1>
          <p className="mt-2 text-sm font-medium text-[#6b6a6b]">Manage your workspace presence and avatar</p>
        </header>

        <div className="relative overflow-hidden rounded-[2rem] bg-white p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-black/5">
          {/* Subtle background element */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#2c0b2e]/5 blur-3xl" />
          
          <div className="relative flex flex-col items-center">
            {/* Avatar Section */}
            <div className="relative group mb-8">
              <div className="flex h-32 w-32 items-center justify-center bg-gradient-to-br from-[#2c0b2e] to-[#1a061b] text-4xl font-black text-white overflow-hidden shadow-2xl rounded-full transition-transform duration-500 group-hover:scale-105 ring-4 ring-white">
                {form.avatarUrl ? (
                  <img src={form.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  form.displayName?.[0]?.toUpperCase() ?? 'U'
                )}
              </div>
              <label 
                className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-sm"
                title="Change photo"
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
                  <Camera size={28} strokeWidth={2.5} />
                )}
              </label>
              
              <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-[#2bac76] border-4 border-white shadow-lg" title="Online" />
            </div>

            <div className="w-full space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Field
                  label="Display Name"
                  placeholder="How should we call you?"
                  value={form.displayName}
                  onChange={(value) => setForm((current) => ({ ...current, displayName: value }))}
                />
                <div className="flex flex-col">
                  <div className="mb-2 text-[11px] font-black uppercase tracking-wider text-[#6b6a6b] ml-1">Workspace Role</div>
                  <div className="flex h-[52px] items-center gap-3 rounded-2xl bg-[#fafafa] px-5 border border-black/5 text-sm font-bold text-[#1d1c1d]">
                    <Users size={16} className="text-[#2c0b2e]/40" />
                    {user?.role}
                  </div>
                </div>
              </div>

              <Field
                label="Avatar URL"
                placeholder="https://example.com/photo.jpg"
                value={form.avatarUrl}
                onChange={(value) => setForm((current) => ({ ...current, avatarUrl: value }))}
              />

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="group relative w-full overflow-hidden rounded-2xl bg-[#2c0b2e] py-4 font-black tracking-wide text-white transition-all hover:bg-[#1a061b] hover:shadow-[0_10px_30px_rgba(44,11,46,0.3)] disabled:opacity-60"
                >
                  <div className="flex items-center justify-center gap-2">
                    {saving ? (
                      <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Save size={18} strokeWidth={2.5} />
                    )}
                    <span>{saving ? 'UPDATING IDENTITY...' : 'SAVE SETTINGS'}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-center text-xs font-bold text-gray-400">
          Last profile sync: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
    );
};

const Field = ({ label, value, onChange, placeholder }) => (
  <label className="flex flex-col">
    <div className="mb-2 text-[11px] font-black uppercase tracking-wider text-[#6b6a6b] ml-1">{label}</div>
    <div className="relative flex h-[52px] items-center gap-3 rounded-2xl bg-[#fafafa] px-5 border border-black/10 transition-all focus-within:bg-white focus-within:border-[#2c0b2e]/30 focus-within:ring-4 focus-within:ring-[#2c0b2e]/5 group">
      <UserRound size={16} className="text-[#2c0b2e]/40 group-focus-within:text-[#2c0b2e]" />
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border-0 bg-transparent text-sm font-bold text-[#1d1c1d] outline-none placeholder:text-gray-300 placeholder:font-medium"
      />
    </div>
  </label>
);

export default ProfilePage;
