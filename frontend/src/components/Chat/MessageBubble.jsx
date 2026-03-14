import { CornerUpRight, Pencil, Pin, SmilePlus, Trash2 } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { formatMessageTimestamp } from '../../utils/formatDate';

const MessageBubble = ({ message, onEdit, onDelete, onPin, onReact }) => {
  const currentUser = useAuthStore((state) => state.user);
  const isMine = currentUser?.id === message.senderId;
  const initial = message.senderName?.[0]?.toUpperCase() ?? 'U';

  return (
    <div className={`group grid grid-cols-[48px_1fr] gap-3 px-5 py-3 transition hover:bg-black/[0.02] ${message.isPinned ? 'bg-[#fff7d6]' : ''}`}>
      <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[#611f69] font-bold text-white">
        {initial}
        {message.isPinned && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ffb900] text-[#1d1c1d]">
            <Pin size={10} />
          </span>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <div className="truncate font-semibold">{message.senderName}</div>
          <div className="text-xs text-[#6b6a6b]">{formatMessageTimestamp(message.sentAt)}</div>
          {message.editedAt && !message.isDeleted && (
            <div className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-[#6b6a6b]">(edited)</div>
          )}
        </div>

        <div className={`mt-1 whitespace-pre-wrap text-sm leading-6 ${message.isDeleted ? 'italic text-[#6b6a6b]' : 'text-[#1d1c1d]'}`}>
          {message.content}
        </div>

        <div className="mt-2 flex translate-y-1 items-center gap-1 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
          <ActionButton title="React" onClick={() => onReact?.(message)}>
            <SmilePlus size={14} />
          </ActionButton>
          <ActionButton title={message.isPinned ? 'Unpin' : 'Pin'} onClick={() => onPin?.(message)}>
            <Pin size={14} />
          </ActionButton>
          {isMine && !message.isDeleted && (
            <>
              <ActionButton title="Edit" onClick={() => onEdit?.(message)}>
                <Pencil size={14} />
              </ActionButton>
              <ActionButton title="Delete" onClick={() => onDelete?.(message)}>
                <Trash2 size={14} />
              </ActionButton>
            </>
          )}
          <div className="rounded-full border border-black/10 bg-white px-2 py-1 text-[11px] text-[#6b6a6b]">
            <CornerUpRight size={12} className="inline" /> Message actions
          </div>
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ children, title, onClick }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className="rounded-full border border-black/10 bg-white p-2 text-[#6b6a6b] shadow-sm transition hover:border-black/15 hover:text-[#1d1c1d]"
  >
    {children}
  </button>
);

export default MessageBubble;
