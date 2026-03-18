const TypingIndicator = ({ users }) => {
  if (!users || Object.keys(users).length === 0) {
    return null;
  }

  const userList = Object.values(users).filter((u) => (u?.isTyping ?? u?.typing ?? false));
  if (userList.length === 0) return null;

  const leadUser = userList[0];
  const typingLabel =
    userList.length === 1
      ? `${leadUser.displayName || 'Someone'} is typing...`
      : `${userList.length} people are typing...`;

  return (
    <div className="px-8 py-1">
      <div className="group flex max-w-[85%] items-end gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#611f69] to-[#3f0e40] font-extrabold text-white">
          {leadUser?.avatar ? (
            <img src={leadUser.avatar} alt={leadUser.displayName || 'Typing user'} className="h-full w-full object-cover" />
          ) : (
            (leadUser?.displayName?.[0] || 'U').toUpperCase()
          )}
        </div>

        <div className="min-w-0">
          <div className="truncate text-[11px] font-bold text-gray-900">
            {leadUser?.displayName || 'Someone'}
          </div>

          <div className="mt-0.5 inline-flex items-center gap-3 rounded-[22px] bg-white px-4 py-3 text-gray-800 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-gray-400 typing-dot"></span>
              <span className="h-2 w-2 rounded-full bg-gray-400 typing-dot" style={{ animationDelay: '0.2s' }}></span>
              <span className="h-2 w-2 rounded-full bg-gray-400 typing-dot" style={{ animationDelay: '0.4s' }}></span>
            </div>
            <span className="text-[11px] font-bold text-gray-500 tracking-tight">
              {typingLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
