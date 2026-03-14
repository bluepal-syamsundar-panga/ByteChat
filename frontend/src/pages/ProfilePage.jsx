import { Save, UserRound, Users } from 'lucide-react';
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

  async function handleMarkNotification(notificationId) {
    await notificationService.markAsRead(notificationId);
    setNotifications(
      notifications.map((item) =>
        item.id === notificationId ? { ...item, isRead: true } : item,
      ),
    );
  }

  return (
    <div className="grid h-full min-h-0 gap-0 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="scrollbar-thin overflow-y-auto border-r border-black/5 p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b6a6b]">Profile</div>
        <h1 className="mt-2 text-3xl font-bold">Workspace identity</h1>

        <div className="mt-6 rounded-[28px] bg-[#f8f8f8] p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#611f69] text-3xl font-bold text-white">
              {form.displayName?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div>
              <div className="text-xl font-semibold">{user?.displayName}</div>
              <div className="text-sm text-[#6b6a6b]">{user?.email}</div>
              <div className="mt-2 inline-flex rounded-full bg-[#e8f5ee] px-3 py-1 text-xs font-semibold text-[#1b7f58]">
                {user?.role}
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            <Field
              label="Display name"
              value={form.displayName}
              onChange={(value) => setForm((current) => ({ ...current, displayName: value }))}
            />
            <Field
              label="Avatar URL"
              value={form.avatarUrl}
              onChange={(value) => setForm((current) => ({ ...current, avatarUrl: value }))}
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#1164a3] px-4 py-3 font-semibold text-white transition hover:bg-[#0c548a] disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      </section>

      <section className="scrollbar-thin overflow-y-auto bg-[#fbfbfb] p-6">
        <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#6b6a6b]">
          <Users size={14} />
          Team presence and notifications
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <div className="text-lg font-semibold">Online now</div>
          <div className="mt-4 space-y-3">
            {onlineUsers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 rounded-2xl border border-black/5 px-3 py-3">
                <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[#611f69] font-bold text-white">
                  {member.displayName?.[0]?.toUpperCase() ?? 'U'}
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#2bac76]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{member.displayName}</div>
                  <div className="truncate text-sm text-[#6b6a6b]">{member.email}</div>
                </div>
                <div className="rounded-full bg-[#f1e8f3] px-3 py-1 text-xs font-semibold text-[#611f69]">{member.role}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[28px] bg-white p-5 shadow-sm">
          <div className="text-lg font-semibold">Notifications</div>
          <div className="mt-4 space-y-3">
            {notifications.length === 0 && <div className="text-sm text-[#6b6a6b]">No notifications yet.</div>}
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleMarkNotification(notification.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  notification.isRead || notification.read
                    ? 'border-black/5 bg-[#fafafa]'
                    : 'border-[#f3c5d2] bg-[#fff2f6]'
                }`}
              >
                <div className="text-sm font-semibold">{notification.type}</div>
                <div className="mt-1 text-sm text-[#6b6a6b]">{notification.content}</div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const Field = ({ label, value, onChange }) => (
  <label className="block">
    <div className="mb-2 text-sm font-medium text-[#1d1c1d]">{label}</div>
    <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3">
      <UserRound size={16} className="text-[#6b6a6b]" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border-0 bg-transparent outline-none"
      />
    </div>
  </label>
);

export default ProfilePage;
