import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import workspaceService from '../services/workspaceService';
import useAuthStore from '../store/authStore';

const WorkspaceWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Details
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f4ede4] px-6 py-12">
      <div className="w-full max-w-md bg-white p-10 shadow-2xl">
        <div className="mb-10 text-center">
          <div className="text-3xl font-black tracking-tighter text-[#3f0e40]">BYTECHAT</div>
          <h2 className="mt-4 text-2xl font-bold italic">
            {step === 1 && 'First, enter your email'}
            {step === 2 && 'Check your email for a code'}
            {step === 3 && 'Final step: Workspace details'}
          </h2>
          <p className="mt-2 text-sm text-[#6b6a6b]">
            {step === 1 && 'We will send you a 6-digit code to verify your email.'}
            {step === 2 && `We sent a code to ${email}`}
            {step === 3 && "You're almost there! Name your workspace."}
          </p>
        </div>

        {error && (
          <div className="mb-6 border-l-4 border-red-500 bg-red-50 p-3 text-sm font-bold text-red-600">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-[#6b6a6b]">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full border-b-2 border-black/10 bg-transparent py-3 text-lg font-bold outline-none transition-colors focus:border-[#3f0e40]"
                placeholder="name@company.com"
                autoFocus
              />
            </div>
            <button
              disabled={loading || !email}
              className="w-full bg-[#3f0e40] py-4 text-lg font-black text-white transition-all hover:bg-[#350d36] disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-[#6b6a6b]">6-Digit Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="mt-2 w-full border-b-2 border-black/10 bg-transparent py-3 text-center text-3xl font-black tracking-[0.5em] outline-none transition-colors focus:border-[#3f0e40]"
                placeholder="000000"
                autoFocus
              />
            </div>
            <button
              disabled={loading || otp.length !== 6}
              className="w-full bg-[#3f0e40] py-4 text-lg font-black text-white transition-all hover:bg-[#350d36] disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-sm font-bold text-[#6b6a6b] hover:underline"
            >
              Wait, I entered the wrong email
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-[#6b6a6b]">Workspace Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full border-b-2 border-black/10 bg-transparent py-3 text-lg font-bold outline-none transition-colors focus:border-[#3f0e40]"
                placeholder="Acme Corp"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-[#6b6a6b]">Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2 w-full border-b-2 border-black/10 bg-transparent py-3 text-lg font-bold outline-none transition-colors focus:border-[#3f0e40]"
                placeholder="Marketing team workspace"
              />
            </div>
            <button
              disabled={loading || !name}
              className="w-full bg-[#3f0e40] py-4 text-lg font-black text-white transition-all hover:bg-[#350d36] disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Workspace'}
            </button>
          </form>
        )}
      </div>
      <button
        onClick={() => navigate('/')}
        className="mt-8 font-bold text-[#6b6a6b] hover:text-[#3f0e40]"
      >
        ← Back to Home
      </button>
    </div>
  );
};

export default WorkspaceWizard;
