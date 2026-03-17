const TypingIndicator = ({ users }) => {
  if (!users || Object.keys(users).length === 0) {
    return null;
  }

  const userList = Object.values(users).filter(u => u.isTyping);
  if (userList.length === 0) return null;

  return (
    <div className="absolute bottom-6 left-8 z-30 pointer-events-none select-none">
      <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="inline-flex items-center gap-3 bg-[#f0f2f5] border border-gray-200/50 px-4 py-2 rounded-2xl shadow-sm">
          <div className="flex -space-x-1.5 overflow-hidden">
            {userList.slice(0, 2).map((user, i) => (
              <div 
                key={user.userId || i} 
                className="inline-block h-5 w-5 rounded-full border border-white bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-600 shadow-xs"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  (user.displayName?.[0] || 'U').toUpperCase()
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-1 items-center">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-500 typing-dot"></span>
            <span className="h-1.5 w-1.5 rounded-full bg-gray-500 typing-dot" style={{ animationDelay: '0.2s' }}></span>
            <span className="h-1.5 w-1.5 rounded-full bg-gray-500 typing-dot" style={{ animationDelay: '0.4s' }}></span>
          </div>

          <span className="text-[11px] font-bold text-gray-600 tracking-tight">
            {userList.length === 1 
              ? `${userList[0].displayName} is typing...` 
              : `${userList.length} people are typing...`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
