import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import workspaceService from '../../services/workspaceService';
import useAuthStore from '../../store/authStore';

const CreateWorkspaceModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Details
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await workspaceService.sendOtp(email);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true);
    setError('');
    try {
      const res = await workspaceService.verifyOtp(email, otp);
      if (res.data.success) {
        setStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    setError('');
    try {
      const res = await workspaceService.createWorkspace(email, { name, description });
      if (res.data.success) {
        const { workspace, auth } = res.data.data;
        
        // Store auth tokens and user info
        const login = useAuthStore.getState().login;
        
        login(
          {
            id: auth.userId,
            email: auth.email,
            displayName: auth.displayName,
            avatarUrl: auth.avatarUrl,
            role: auth.role
          },
          auth.accessToken,
          auth.refreshToken
        );

        // Navigate to the newly created workspace
        navigate(`/chat/workspace/${workspace.id}`);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-lg bg-white rounded-none shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-none transition-all z-10"
        >
          <X size={24} />
        </button>

        <div className="p-10">
          <div className="mb-10 text-center">
            <div className="text-3xl font-black tracking-tighter text-[#3f0e40]">BYTECHAT</div>
            <h2 className="mt-4 text-2xl font-bold text-[#1d1c1d]">
              {step === 1 && 'First, enter your email'}
              {step === 2 && 'Check your email for a code'}
              {step === 3 && 'Final step: Workspace details'}
            </h2>
            <p className="mt-2 text-sm text-[#6b6a6b] font-medium">
              {step === 1 && 'We will send you a 6-digit code to verify your email.'}
              {step === 2 && `We sent a code to ${email}`}
              {step === 3 && "You're almost there! Name your workspace."}
            </p>
          </div>

          {error && (
            <div className="mb-6 border-l-4 border-red-500 bg-red-50 p-4 text-sm font-bold text-red-600 rounded-none">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#6b6a6b] mb-2 pl-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-none px-6 py-4 text-lg font-bold outline-none transition-all focus:border-[#3f0e40] focus:bg-white focus:shadow-inner"
                  placeholder="name@company.com"
                  autoFocus
                />
              </div>
              <button
                disabled={loading || !email}
                className="w-full bg-[#3f0e40] py-4 rounded-none text-lg font-black text-white shadow-xl shadow-purple-900/10 transition-all hover:bg-[#350d36] hover:shadow-2xl active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send code'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#6b6a6b] mb-2 pl-1 text-center">6-Digit Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-none px-6 py-4 text-center text-4xl font-black tracking-[0.5em] outline-none transition-all focus:border-[#3f0e40] focus:bg-white focus:shadow-inner"
                  placeholder="000000"
                  autoFocus
                />
              </div>
              <button
                disabled={loading || otp.length !== 6}
                className="w-full bg-[#3f0e40] py-4 rounded-none text-lg font-black text-white shadow-xl shadow-purple-900/10 transition-all hover:bg-[#350d36] hover:shadow-2xl active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify code'}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-sm font-bold text-[#6b6a6b] hover:text-[#3f0e40] transition-colors"
              >
                Wait, I entered the wrong email
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#6b6a6b] mb-2 pl-1">Workspace Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-none px-6 py-4 text-lg font-bold outline-none transition-all focus:border-[#3f0e40] focus:bg-white focus:shadow-inner"
                  placeholder="Acme Corp"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#6b6a6b] mb-2 pl-1">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-none px-6 py-4 text-lg font-bold outline-none transition-all focus:border-[#3f0e40] focus:bg-white focus:shadow-inner"
                  placeholder="Marketing team workspace"
                />
              </div>
              <button
                disabled={loading || !name}
                className="w-full bg-[#3f0e40] py-4 rounded-none text-lg font-black text-white shadow-xl shadow-purple-900/10 transition-all hover:bg-[#350d36] hover:shadow-2xl active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create workspace'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateWorkspaceModal;
