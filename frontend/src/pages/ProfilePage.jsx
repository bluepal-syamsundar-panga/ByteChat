import React, { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import api from '../services/api';

const ProfilePage = () => {
  const user = useAuthStore(state => state.user);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const fetchOnline = async () => {
      try {
        const res = await api.get('/users/online');
        if (res.data.success) {
          setOnlineUsers(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load online users", err);
      }
    };
    fetchOnline();
  }, []);

  return (
    <div className="p-8 h-full bg-white overflow-y-auto">
      <h2 className="text-3xl font-bold mb-6 text-slack-textPrimary border-b pb-4">Profile & Directory</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-xl font-semibold mb-4 text-slack-sidebar">Your Profile</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
               <div className="w-16 h-16 rounded bg-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
               </div>
               <div>
                  <p className="font-bold text-lg">{user?.displayName}</p>
                  <p className="text-gray-500">{user?.email}</p>
                  <p className="text-xs text-indigo-600 font-bold mt-1 tracking-wide">{user?.role || 'MEMBER'}</p>
                  <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <span className="w-2 h-2 mr-1.5 bg-green-500 rounded-full"></span>
                    Active
                  </span>
               </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-xl font-semibold mb-4 text-slack-sidebar">Who's Online</h3>
          <ul className="space-y-3">
            {onlineUsers.length === 0 && <li className="text-sm text-gray-500">No other users online right now.</li>}
            {onlineUsers.map(u => (
              <li key={u.id} className="flex items-center space-x-3 text-sm">
                 <div className="relative">
                   <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center text-white font-bold">
                      {u.displayName?.charAt(0).toUpperCase()}
                   </div>
                   <div className="absolute right-0 bottom-0 w-2.5 h-2.5 bg-slack-onlineDot rounded-full border-2 border-white"></div>
                 </div>
                 <span className="font-medium">{u.displayName} {u.id === user?.id ? '(You)' : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
