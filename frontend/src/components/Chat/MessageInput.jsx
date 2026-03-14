import { Paperclip, SendHorizonal, SmilePlus } from 'lucide-react';
import { useMemo, useState } from 'react';

const MessageInput = ({
  placeholder,
  onSendMessage,
  onTyping,
  onUploadFile,
  disabled,
  mentionSuggestions = [],
}) => {
  const [content, setContent] = useState('');
  const canSend = useMemo(() => content.trim().length > 0 && !disabled, [content, disabled]);
  const mentionQuery = useMemo(() => {
    const match = content.match(/@([A-Za-z0-9._-]*)$/);
    return match ? match[1].toLowerCase() : '';
  }, [content]);
  const filteredSuggestions = useMemo(() => {
    if (!mentionQuery) {
      return [];
    }
    return mentionSuggestions
      .filter((member) => member.displayName?.toLowerCase().includes(mentionQuery))
      .slice(0, 5);
  }, [mentionQuery, mentionSuggestions]);

  function handleSubmit(event) {
    event.preventDefault();
    const value = content.trim();
    if (!value) {
      return;
    }
    onSendMessage(value);
    setContent('');
    onTyping?.(false);
  }

  function handleChange(event) {
    setContent(event.target.value);
    onTyping?.(event.target.value.trim().length > 0);
  }

  function handleSelectMention(member) {
    setContent((current) => current.replace(/@([A-Za-z0-9._-]*)$/, `@${member.displayName.replace(/\s+/g, '')} `));
  }

  return (
    <div className="border-t border-black/5 bg-white px-4 py-4 md:px-5">
      <form onSubmit={handleSubmit} className="rounded-[24px] border border-[#d8d8d8] bg-[#fbfbfb] p-3 shadow-sm">
        <textarea
          rows={3}
          value={content}
          onChange={handleChange}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              handleSubmit(event);
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          className="min-h-[72px] w-full resize-none bg-transparent text-sm text-[#1d1c1d] outline-none placeholder:text-[#6b6a6b]"
        />
        {filteredSuggestions.length > 0 && (
          <div className="mb-3 rounded-2xl border border-black/8 bg-white p-2 shadow-sm">
            {filteredSuggestions.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => handleSelectMention(member)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-black/5"
              >
                <span className="font-medium text-[#1d1c1d]">{member.displayName}</span>
                <span className="text-xs text-[#6b6a6b]">{member.email}</span>
              </button>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onUploadFile}
              className="rounded-full p-2 text-[#6b6a6b] transition hover:bg-black/5 hover:text-[#1d1c1d]"
              title="Upload attachment"
            >
              <Paperclip size={18} />
            </button>
            <button
              type="button"
              className="rounded-full p-2 text-[#6b6a6b] transition hover:bg-black/5 hover:text-[#1d1c1d]"
              title="Add reaction hint"
            >
              <SmilePlus size={18} />
            </button>
            <div className="hidden text-xs text-[#6b6a6b] md:block">
              Use <span className="font-semibold">@mentions</span>, reactions, editing, pinning, and files.
            </div>
          </div>
          <button
            type="submit"
            disabled={!canSend}
            className="inline-flex items-center gap-2 rounded-full bg-[#1164a3] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0c548a] disabled:cursor-not-allowed disabled:bg-[#b0c9de]"
          >
            Send
            <SendHorizonal size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
