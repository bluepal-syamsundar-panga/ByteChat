const TypingIndicator = ({ users }) => {
  if (!users?.length) {
    return null;
  }

  const names = users.slice(0, 2).join(', ');
  const suffix = users.length > 2 ? ` and ${users.length - 2} more` : '';

  return (
    <div className="flex items-center gap-2 px-5 pb-2 text-sm text-[#6b6a6b]">
      <div className="flex gap-1">
        <span className="h-2 w-2 animate-bounce bg-[#611f69] [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce bg-[#611f69] [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce bg-[#611f69]" />
      </div>
      <span>{`${names}${suffix} ${users.length > 1 ? 'are' : 'is'} typing...`}</span>
    </div>
  );
};

export default TypingIndicator;
