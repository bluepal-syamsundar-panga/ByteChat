import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MessageSquare, Hash, LogOut, User as UserIcon, Plus } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import chatService from '../../services/chatService';

const Sidebar = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { rooms, setRooms, addRoom } = useChatStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await chatService.getRooms();
        if (res.success) {
          setRooms(res.data.content || []);
        }
      } catch (err) {
        console.error("Failed to load rooms", err);
      }
    };
    fetchRooms();
  }, [setRooms]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateRoom = async () => {
    const roomName = prompt("Enter new room name:");
    if (roomName && roomName.trim()) {
      try {
        const res = await chatService.createRoom(roomName);
        if (res.success) {
          addRoom(res.data);
          navigate(`/chat/room/${res.data.id}`);
        }
      } catch (err) {
        alert("Failed to create room: " + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <div className="w-64 bg-slack-sidebar text-white flex flex-col h-full shrink-0">
      {/* Workspace Header */}
      <div className="h-12 flex items-center px-4 font-bold border-b border-slack-sidebarHover hover:bg-slack-sidebarHover cursor-pointer transition-colors">
        ByteChat Workspace
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <div className="px-4 mb-4">
          <div className="flex items-center space-x-2 text-gray-300 hover:bg-slack-sidebarHover p-1 rounded cursor-pointer">
            <MessageSquare size={16} />
            <span className="text-sm">Threads</span>
          </div>
        </div>

        {/* Channels Section */}
        <div className="mb-6">
          <div className="px-4 flex items-center justify-between text-gray-400 text-sm mb-1 hover:text-gray-200 cursor-pointer">
            <span className="font-semibold">Channels</span>
            <button onClick={handleCreateRoom} className="hover:text-white p-1" title="Create Channel">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-0.5">
            {rooms.map(room => (
              <NavLink
                key={room.id}
                to={`/chat/room/${room.id}`}
                className={({ isActive }) =>
                  `flex items-center px-4 py-1 text-sm ${
                    isActive ? 'bg-slack-activeChannel text-white' : 'text-gray-300 hover:bg-slack-sidebarHover'
                  }`
                }
              >
                <Hash size={16} className="mr-2 opacity-70" />
                {room.name}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Direct Messages Section */}
        <div>
          <div className="px-4 flex items-center justify-between text-gray-400 text-sm mb-1 hover:text-gray-200 cursor-pointer">
            <span className="font-semibold">Direct messages</span>
            <span className="text-xs">+</span>
          </div>
          <div className="space-y-0.5">
            {/* Hardcoded DM for placeholder */}
            <NavLink
              to="/chat/dm/1"
              className={({ isActive }) =>
                `flex items-center px-4 py-1 text-sm ${
                  isActive ? 'bg-slack-activeChannel text-white' : 'text-gray-300 hover:bg-slack-sidebarHover'
                }`
              }
            >
              <div className="relative mr-2 flex items-center justify-center">
                <div className="w-5 h-5 bg-blue-500 rounded text-xs flex items-center justify-center font-bold">U</div>
                <div className="absolute right-0 bottom-0 w-2 h-2 bg-slack-onlineDot rounded-full border border-slack-sidebar"></div>
              </div>
              User 1
            </NavLink>
          </div>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-slack-sidebarHover text-sm">
        <NavLink to="/profile" className="flex items-center space-x-2 w-full hover:bg-slack-sidebarHover p-1 rounded text-gray-300 hover:text-white transition-colors">
          <UserIcon size={16} />
          <span className="truncate flex-1">{user?.displayName || 'Profile'}</span>
        </NavLink>
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-2 w-full mt-2 hover:bg-slack-sidebarHover p-1 rounded text-gray-400 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
