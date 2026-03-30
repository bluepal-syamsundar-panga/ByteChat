import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import chatService from '../services/chatService';
import NotificationPanel from '../components/Common/NotificationPanel';
import { connectWebSocket, disconnectWebSocket, subscribeToNotifications } from '../services/websocket';
import logo3 from '../assets/logo3.png';
import { ArrowRight, Layout, MessageCircle, Users, Link as LinkIcon, Search, Zap, UserCircle2, ChevronDown, LogOut } from 'lucide-react';
import CreateWorkspaceModal from '../components/Workspaces/CreateWorkspaceModal';


const LandingPage = () => {
  const navigate = useNavigate();
  const { workspaces, setWorkspaces } = useChatStore();
  const { user } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await chatService.getWorkspaces();
        const data = response.data?.content || response.data || [];
        if (Array.isArray(data)) {
          setWorkspaces(data);
        }
      } catch (error) {
        console.error('Failed to fetch workspaces:', error);
      }
    };

    fetchWorkspaces();
  }, [setWorkspaces]);

  useEffect(() => {
    if (!user?.id) {
      return undefined;
    }

    connectWebSocket(() => {
      subscribeToNotifications(user.id, (notification) => {
        useChatStore.getState().setNotifications((prev) => [notification, ...prev]);
      });
    });

    return () => disconnectWebSocket();
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const features = [
    {
      title: 'Real-time Channels',
      description: 'Organize your conversations into workspaces and channels for better focus.',
      icon: <MessageCircle className="text-[#3f0e40]" size={24} />,
      color: 'bg-purple-100',
    },
    {
      title: 'Direct Messages',
      description: 'Chat directly with teammates, even across different channels and workspaces.',
      icon: <Users className="text-blue-600" size={24} />,
      color: 'bg-blue-100',
    },
    {
      title: 'Seamless Sharing',
      description: 'Share documents, images, and videos instantly with advanced file previews.',
      icon: <LinkIcon className="text-emerald-600" size={24} />,
      color: 'bg-emerald-100',
    },
    {
      title: 'Powerful Search',
      description: 'Find anything across all your channels and history with lightning speed.',
      icon: <Search className="text-amber-600" size={24} />,
      color: 'bg-amber-100',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#f4ede4] text-[#1d1c1d] scroll-smooth">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between bg-[#3f0e40] px-8 backdrop-blur-md">
        <div className="flex items-center group cursor-pointer" onClick={() => navigate('/')}>
          <img src={logo3} alt="ByteChat" className="h-10 w-auto transition-transform group-hover:scale-110" />
        </div>
        <div className="flex items-center gap-8">
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm font-semibold text-white/80 hover:text-white transition-colors">Features</a>
            <a href="#workspaces" className="text-sm font-semibold text-white/80 hover:text-white transition-colors">Workspaces</a>
          </nav>

          {user && (
            <div className="mr-2">
              <NotificationPanel variant="light" position="bottom" allowedTypes={['WORKSPACE_INVITE']} />
            </div>
          )}

          {user && (
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-3 px-1 py-1 text-left text-white transition-all hover:opacity-85 active:scale-95"
              >
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/15 text-white">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
                  ) : (
                    <UserCircle2 size={20} />
                  )}
                </div>
                <div className="hidden sm:block">
                  <div className="max-w-[140px] truncate text-sm font-bold">
                    {user.displayName || 'Profile'}
                  </div>
                </div>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full mt-3 w-72 overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">
                  <div className="border-b border-black/5 bg-[#f8f5f9] px-4 py-4">
                    <div className="text-sm font-black text-[#1d1c1d]">{user.displayName}</div>
                    <div className="mt-1 break-all text-xs font-semibold text-[#6b6a6b]">{user.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-[#e01e5a] transition-colors hover:bg-[#fff1f4]"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-white px-5 py-2 text-sm font-bold text-[#3f0e40] rounded-lg transition-all hover:bg-white/90 shadow-lg active:scale-95"
          >
            Create Workspace
          </button>
        </div>
      </header>


      {/* Hero Section - Slack Inspired */}
      <section className="bg-[#3f0e40] pt-16 pb-28 px-6 text-center text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 flex items-center justify-center gap-4">
            Welcome back <span className="animate-wave inline-block">👋</span>
          </h1>
          <p className="text-xl font-medium text-white/70">Choose a workspace to get started.</p>
        </div>

        {/* Curvature transition */}
        <div className="absolute bottom-0 left-0 w-full h-16 bg-[#f4ede4] rounded-t-[100px] lg:rounded-t-[200px]" />
      </section>

      {/* Main Content Area - Workspace Section */}
      <main id="workspaces" className="w-full px-12 -mt-24 relative z-10 pb-20 bg-[#fbf5f0] rounded-t-[80px] pt-20 shadow-[0_-20px_50px_-10px_rgba(0,0,0,0.1)] animate-reveal">
        <div className="flex items-center gap-4 mb-10 pl-4">
          <div className="w-1.5 h-10 bg-[#3f0e40] rounded-full shadow-sm" />
          <h2 className="text-4xl font-black tracking-tighter text-[#3f0e40]">My workspaces</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.length > 0 ? (
            workspaces.map((ws, index) => (
              <div
                key={ws.id}
                onClick={() => navigate(`/chat/workspace/${ws.id}`)}
                style={{ animationDelay: `${index * 100}ms` }}
                className="animate-slide-up group bg-white rounded-2xl p-5 shadow-sm border border-black/5 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-[#3f0e40]/20 flex flex-col items-center text-center relative overflow-hidden"
              >
                {/* Decorative background element on hover */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-[#3f0e40]/[0.02] rounded-bl-full -mr-10 -mt-10 transition-all duration-500 group-hover:scale-150 group-hover:bg-[#3f0e40]/[0.05]" />

                <div className="w-14 h-14 bg-gradient-to-br from-[#3f0e40] to-[#611f69] rounded-xl flex items-center justify-center text-2xl font-black text-white shadow-lg mb-3 transform transition-transform group-hover:rotate-6 group-hover:scale-110">
                  {ws.name[0].toUpperCase()}
                </div>

                <h3 className="text-xl font-black text-[#1d1c1d] group-hover:text-[#3f0e40] transition-colors mb-1">{ws.name}</h3>

                <p className="text-[13px] text-[#6b6a6b] font-medium leading-normal mb-3 line-clamp-2 min-h-[36px]">
                  {ws.description || 'Modern collaboration for teams.'}
                </p>

                <div className="mt-2 w-full pt-3 border-t border-black/5 flex items-center justify-between text-[#3f0e40] font-bold text-[13px] opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                  <span>Open workspace</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-white/50 rounded-3xl border-2 border-dashed border-black/5">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Layout size={32} className="text-[#3f0e40]/20" />
              </div>
              <p className="text-[#6b6a6b] font-bold text-lg mb-4">No workspaces found</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-3 bg-[#3f0e40] text-white font-bold rounded-xl hover:shadow-lg active:scale-95 transition-all"
              >
                Create your first workspace
              </button>
            </div>

          )}
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="px-12 py-24 bg-[#fcf9f6] relative overflow-hidden animate-reveal">
        {/* Decorative background shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#3f0e40]/[0.02] rounded-full -mr-64 -mt-64 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/[0.02] rounded-full -ml-48 -mb-48 blur-3xl" />

        <div className="mx-auto max-w-7xl relative z-10">
          <div className="mb-16 text-center mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Zap size={20} className="text-[#3f0e40] fill-[#3f0e40]" />
              <span className="text-sm font-black uppercase tracking-widest text-[#3f0e40]/60">Capabilities</span>
            </div>
            <h2 className="text-5xl font-black tracking-tighter text-[#1d1c1d] mb-6">Built for productivity</h2>
            <p className="text-xl text-[#6b6a6b] max-w-2xl mx-auto font-medium leading-relaxed">
              ByteChat is packed with enterprise-grade features designed to help your team work faster, smarter, and safer.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, idx) => (
              <div
                key={idx}
                style={{ animationDelay: `${(idx + 1) * 100}ms` }}
                className="animate-slide-up group bg-white rounded-3xl p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-black/5 hover:shadow-2xl hover:shadow-[#3f0e40]/5 hover:-translate-y-1 transition-all duration-500 cursor-default"
              >
                <h3 className="text-2xl font-black text-[#1d1c1d] mb-3">{feature.title}</h3>
                <p className="text-[#6b6a6b] font-medium leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#3f0e40] text-white px-4 py-4 border-t border-white/5">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center">
              <img src={logo3} alt="ByteChat" className="h-10 w-24 object-contain brightness-0 invert opacity-80" />
            </div>

            <div className="flex items-center gap-10">
              {['Features', 'Integrations', 'Enterprise', 'Solutions'].map(item => (
                <a key={item} href="#" className="text-white/60 hover:text-white font-bold text-sm transition-colors">{item}</a>
              ))}
            </div>

            <div className="text-[12px] font-bold text-white/30 tracking-widest uppercase">
              © 2026 BYTECHAT. INC.
            </div>
          </div>
        </div>
      </footer>

      <CreateWorkspaceModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />

      <style dangerouslySetInnerHTML={{

        __html: `
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          50% { transform: rotate(10deg); }
          75% { transform: rotate(-5deg); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-wave {
          animation: wave 1.5s ease-in-out infinite;
          transform-origin: 70% 70%;
        }
        .animate-slide-up {
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        @keyframes reveal {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-reveal {
          animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        html {
          scroll-behavior: smooth;
        }
      `}} />
    </div>
  );
};

export default LandingPage;
