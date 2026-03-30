import { Video, KeyRound, Presentation, LoaderCircle, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import meetingService from '../../services/meetingService';
import useChatStore from '../../store/chatStore';
import useToastStore from '../../store/toastStore';
import UnsavedChangesModal from '../Shared/UnsavedChangesModal';

const initialForm = { title: '', password: '' };

const MeetingLauncherModal = ({
  isOpen,
  onClose,
  channel,
  workspaceId,
  mode = 'create',
  selectedMeeting = null,
  onMeetingJoined,
}) => {
  const { meetings, setMeetings, upsertMeeting } = useChatStore();
  const addToast = useToastStore((state) => state.addToast);
  const [form, setForm] = useState(initialForm);
  const [joinPassword, setJoinPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDiscardWarning, setShowDiscardWarning] = useState(false);

  const activeMeeting = useMemo(
    () => selectedMeeting || (meetings || []).find((meeting) => String(meeting.channelId) === String(channel?.id) && meeting.isActive),
    [selectedMeeting, meetings, channel?.id]
  );

  useEffect(() => {
    if (!isOpen || !workspaceId) return;

    let mounted = true;
    const loadMeetings = async () => {
      setLoading(true);
      try {
        const response = await meetingService.getWorkspaceMeetings(workspaceId);
        const data = response?.data?.data || response?.data || [];
        if (mounted) {
          setMeetings(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to load meetings', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadMeetings();
    return () => {
      mounted = false;
    };
  }, [isOpen, workspaceId, setMeetings]);

  useEffect(() => {
    if (!isOpen) {
      setForm(initialForm);
      setJoinPassword('');
      setSubmitting(false);
      setShowDiscardWarning(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hasUnsavedChanges = mode === 'create'
    ? Boolean(form.title.trim() || form.password.trim())
    : Boolean(joinPassword.trim());

  const closeModal = () => {
    setForm(initialForm);
    setJoinPassword('');
    setSubmitting(false);
    setShowDiscardWarning(false);
    onClose?.();
  };

  const requestClose = () => {
    if (hasUnsavedChanges) {
      setShowDiscardWarning(true);
      return;
    }
    closeModal();
  };

  const handleCreateMeeting = async (event) => {
    event.preventDefault();
    if (!channel?.id || !form.title.trim() || !form.password.trim()) {
      addToast('Enter meeting name and password.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await meetingService.createMeeting(channel.id, form.title.trim(), form.password.trim());
      const meeting = response?.data?.data || response?.data;
      upsertMeeting(meeting);
      onMeetingJoined?.(meeting);
      addToast('Meeting started successfully.', 'success');
      closeModal();
    } catch (error) {
      console.error('Failed to create meeting', error);
      addToast(error?.response?.data?.message || 'Unable to start meeting.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinMeeting = async (event) => {
    event.preventDefault();
    if (!activeMeeting?.id || !joinPassword.trim()) {
      addToast('Enter the meeting password.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await meetingService.joinMeeting(activeMeeting.id, joinPassword.trim());
      const meeting = response?.data?.data || response?.data;
      upsertMeeting(meeting);
      onMeetingJoined?.(meeting);
      addToast('Joined meeting.', 'success');
      closeModal();
    } catch (error) {
      console.error('Failed to join meeting', error);
      addToast(error?.response?.data?.message || 'Unable to join meeting.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          requestClose();
        }
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-none bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="border-b border-black/5 bg-gradient-to-r from-[#2c0b2e] to-[#5e1a61] px-6 py-5 text-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-white/60">
                {mode === 'join' ? 'Join Meeting' : 'Create Meeting'}
              </div>
              <h2 className="mt-1 text-2xl font-black tracking-tight">#{channel?.name}</h2>
            </div>
            <button
              type="button"
              onClick={requestClose}
              className="text-white transition hover:text-white/75"
              title="Close"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div>
          {mode === 'create' ? (
            <form onSubmit={handleCreateMeeting} className="p-6">
            <div className="flex items-center gap-2 text-sm font-black text-[#1d1c1d]">
              <Presentation size={16} />
              Create meeting
            </div>
            <p className="mt-2 text-sm text-[#6b6a6b]">
              Start a live video room for everyone in this channel.
            </p>
            <div className="mt-5 space-y-4">
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Meeting name"
                className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-[#3f0e40]"
              />
              <input
                value={form.password}
                type="password"
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Meeting password"
                className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-[#3f0e40]"
              />
              <button
                type="submit"
                disabled={submitting || Boolean(activeMeeting)}
                className="flex w-full items-center justify-center gap-2 rounded-none bg-[#3f0e40] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#350d36] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? <LoaderCircle size={16} className="animate-spin" /> : <Video size={16} />}
                {activeMeeting ? 'Live meeting already exists' : 'Start meeting'}
              </button>
            </div>
            </form>
          ) : (
            <form onSubmit={handleJoinMeeting} className="p-6">
            <div className="flex items-center gap-2 text-sm font-black text-[#1d1c1d]">
              <KeyRound size={16} />
              Join meeting
            </div>
            <p className="mt-2 text-sm text-[#6b6a6b]">
              Join the live meeting in this channel with its password.
            </p>
            <div className="mt-5 rounded-2xl border border-dashed border-black/10 bg-[#faf7fb] p-4">
              {loading ? (
                <div className="text-sm text-[#6b6a6b]">Loading live meetings...</div>
              ) : activeMeeting ? (
                <>
                  <div className="text-sm font-black text-[#1d1c1d]">{activeMeeting.title}</div>
                  <div className="mt-1 text-xs text-[#6b6a6b]">
                    Started by {activeMeeting.creator?.displayName} in #{activeMeeting.channelName}
                  </div>
                </>
              ) : (
                <div className="text-sm text-[#6b6a6b]">No live meeting is running in this channel yet.</div>
              )}
            </div>
            <div className="mt-4 space-y-4">
              <input
                value={joinPassword}
                type="password"
                onChange={(event) => setJoinPassword(event.target.value)}
                placeholder="Enter meeting password"
                className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-[#3f0e40]"
              />
              <button
                type="submit"
                disabled={submitting || !activeMeeting}
                className="flex w-full items-center justify-center gap-2 rounded-none border border-[#3f0e40]/20 bg-[#f4ebf5] px-4 py-3 text-sm font-bold text-[#3f0e40] transition hover:bg-[#ead9ec] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? <LoaderCircle size={16} className="animate-spin" /> : <Video size={16} />}
                Join live meeting
              </button>
            </div>
            </form>
          )}
        </div>
      </div>
      <UnsavedChangesModal
        isOpen={showDiscardWarning}
        onCancel={() => setShowDiscardWarning(false)}
        onConfirm={closeModal}
      />
    </div>
  );
};

export default MeetingLauncherModal;
