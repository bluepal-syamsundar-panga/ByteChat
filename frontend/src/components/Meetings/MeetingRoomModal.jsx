import { ExternalLink, PhoneOff } from 'lucide-react';
import meetingService from '../../services/meetingService';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import useToastStore from '../../store/toastStore';

const MeetingRoomModal = ({ meeting, isOpen, onClose }) => {
  const currentUser = useAuthStore((state) => state.user);
  const { removeMeeting } = useChatStore();
  const addToast = useToastStore((state) => state.addToast);

  if (!isOpen || !meeting) return null;

  const displayName = encodeURIComponent(currentUser?.displayName || 'ByteChat User');
  const iframeSrc = `https://meet.jit.si/${meeting.roomKey}#userInfo.displayName="${displayName}"`;
  const isCreator = String(meeting.creator?.id) === String(currentUser?.id);

  const handleEndMeeting = async () => {
    try {
      await meetingService.endMeeting(meeting.id);
      removeMeeting(meeting.id);
      addToast('Meeting ended.', 'success');
      onClose?.();
    } catch (error) {
      console.error('Failed to end meeting', error);
      addToast(error?.response?.data?.message || 'Unable to end meeting.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black">
      <div className="flex items-center justify-between border-b border-white/10 bg-black/80 px-5 py-3 text-white">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-white/50">Live Meeting</div>
          <div className="mt-1 text-lg font-black">{meeting.title}</div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`https://meet.jit.si/${meeting.roomKey}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
          >
            <ExternalLink size={14} />
            Open in new tab
          </a>
          {isCreator && (
            <button
              type="button"
              onClick={handleEndMeeting}
              className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
            >
              <PhoneOff size={14} />
              End meeting
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>
      <iframe
        title={meeting.title}
        src={iframeSrc}
        allow="camera; microphone; display-capture; fullscreen; speaker-selection"
        className="h-full w-full"
      />
    </div>
  );
};

export default MeetingRoomModal;
