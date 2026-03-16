import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import chatService from '../services/chatService';
import NotificationPanel from '../components/Common/NotificationPanel';

const LandingPage = () => {
  const navigate = useNavigate();
  const { workspaces, setWorkspaces } = useChatStore();
  const { user } = useAuthStore();

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

  const features = [
    {
      title: 'Real-time Channels',
      description: 'Organize your conversations into workspaces and channels for better focus.',
      icon: '💬',
    },
    {
      title: 'Direct Messages',
      description: 'Chat directly with members of your workspace, even across different channels.',
      icon: '👥',
    },
    {
      title: 'File Sharing',
      description: 'Share documents, images, and videos seamlessly with your team.',
      icon: '📎',
    },
    {
      title: 'Global Search',
      description: 'Find anything across all your channels and messages instantly.',
      icon: '🔍',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#f4ede4] text-[#1d1c1d]">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-black/5 bg-white/80 px-8 backdrop-blur-md">
        <div className="text-2xl font-black tracking-tighter text-[#3f0e40]">
           BYTECHAT
        </div>
        <div className="flex items-center gap-8">
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm font-semibold hover:text-[#3f0e40]">Features</a>
            <a href="#workspaces" className="text-sm font-semibold hover:text-[#3f0e40]">Workspaces</a>
          </nav>
          
          {user && (
            <div className="mr-4">
              <NotificationPanel variant="dark" />
            </div>
          )}

          <button
            onClick={() => navigate('/create-workspace')}
            className="bg-[#3f0e40] px-5 py-2 text-sm font-bold text-white transition-all hover:bg-[#350d36] hover:shadow-lg active:scale-95"
          >
            Create Workspace
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center px-6 py-24 text-center overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#3f0e40]/5 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#3f0e40]/5 blur-3xl" />
        
        <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight sm:text-7xl">
          Everything your <span className="text-[#3f0e40]">team</span> needs to work in one place.
        </h1>
        <p className="mt-8 max-w-2xl text-xl text-[#6b6a6b]">
          ByteChat brings all your communication together. From channels to direct messages, it's the simplest way to stay connected.
        </p>
        <div className="mt-12 flex gap-4">
          <button
            onClick={() => navigate('/create-workspace')}
            className="rounded-lg bg-[#3f0e40] px-8 py-4 text-lg font-bold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-[#350d36]"
          >
            Get Started for Free
          </button>
          <a
            href="#features"
            className="rounded-lg bg-white px-8 py-4 text-lg font-bold shadow-md transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Workspace Section */}
      <section id="workspaces" className="px-8 py-20 bg-white/50">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-black tracking-tight mb-10">Your Workspaces</h2>
          {workspaces.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  onClick={() => navigate(`/chat/workspace/${ws.id}`)}
                  className="group cursor-pointer border border-black/5 bg-white p-6 shadow-sm transition-all hover:border-[#3f0e40]/30 hover:shadow-xl"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center bg-[#3f0e40] text-xl font-bold text-white">
                    {ws.name[0].toUpperCase()}
                  </div>
                  <h3 className="text-xl font-bold group-hover:text-[#3f0e40]">{ws.name}</h3>
                  <p className="mt-2 text-sm text-[#6b6a6b] line-clamp-2">
                    {ws.description || 'No description provided.'}
                  </p>
                  <div className="mt-6 flex items-center text-sm font-bold text-[#3f0e40] opacity-0 transition-opacity group-hover:opacity-100">
                    Open Workspace <span>→</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-black/5 rounded-2xl bg-white/30">
              <div className="text-4xl mb-4">🏠</div>
              <h3 className="text-xl font-bold">No workspaces yet</h3>
              <p className="mt-2 text-[#6b6a6b]">Create your first workspace to start chatting.</p>
              <button
                onClick={() => navigate('/create-workspace')}
                className="mt-6 font-bold text-[#3f0e40] hover:underline"
              >
                Create your first workspace
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-8 py-20 bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black tracking-tight">Built for productivity</h2>
            <p className="mt-4 text-lg text-[#6b6a6b]">ByteChat is packed with features to help your team work faster.</p>
          </div>
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#3f0e40]/5 text-3xl">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-black">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#6b6a6b]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-black/5 bg-white px-8 py-12">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-10 md:flex-row">
          <div>
            <div className="text-xl font-black tracking-tighter text-[#3f0e40]">
              BYTECHAT
            </div>
            <p className="mt-4 text-sm text-[#6b6a6b]">
               The real-time workspace for modern teams.
            </p>
          </div>
          <div className="flex gap-20">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#6b6a6b]">Product</h4>
              <ul className="mt-4 space-y-2 text-sm font-semibold">
                <li><a href="#" className="hover:text-[#3f0e40]">Features</a></li>
                <li><a href="#" className="hover:text-[#3f0e40]">Integrations</a></li>
                <li><a href="#" className="hover:text-[#3f0e40]">Enterprise</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#6b6a6b]">Community</h4>
              <ul className="mt-4 space-y-2 text-sm font-semibold">
                <li><a href="#" className="hover:text-[#3f0e40]">Events</a></li>
                <li><a href="#" className="hover:text-[#3f0e40]">Forum</a></li>
                <li><a href="#" className="hover:text-[#3f0e40]">Partners</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-6xl border-t border-black/5 pt-8 text-xs font-bold text-[#6b6a6b]">
          © 2026 BYTECHAT. INC. ALL RIGHTS RESERVED.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
