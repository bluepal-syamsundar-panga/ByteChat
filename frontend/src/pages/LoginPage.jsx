import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import useAuthStore from '../store/authStore';

const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await authService.login(form);
      const payload = response.data;
      login(
        {
          id: payload.userId,
          email: payload.email,
          displayName: payload.displayName,
          avatarUrl: payload.avatarUrl,
          role: payload.role,
        },
        payload.accessToken,
        payload.refreshToken,
      );
      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      <section className="hidden flex-1 bg-[#3f0e40] px-16 py-14 text-white lg:flex lg:flex-col">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">ByteChat</div>
        <div className="mt-12 max-w-xl">
          <h1 className="text-5xl font-bold leading-tight">
            Real-time collaboration with a Slack-style workspace.
          </h1>
          <p className="mt-6 text-lg leading-8 text-white/72">
            Rooms, DMs, presence, notifications, editing, deleting, pinning, reactions, attachments,
            typing indicators, and JWT-secured messaging built for OWNER and MEMBER roles.
          </p>
        </div>
      </section>

      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-white p-8 shadow-[0_18px_60px_rgba(63,14,64,0.12)] border border-black/5">
          <div className="mb-8">
            <div className="text-sm font-semibold uppercase tracking-[0.25em] text-[#611f69]">Welcome back</div>
            <h2 className="mt-2 text-3xl font-bold text-[#1d1c1d]">Sign in to ByteChat</h2>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <Field
              icon={<Mail size={16} />}
              type="email"
              label="Email"
              value={form.email}
              onChange={(value) => setForm((current) => ({ ...current, email: value }))}
            />
            <Field
              icon={<LockKeyhole size={16} />}
              type="password"
              label="Password"
              value={form.password}
              onChange={(value) => setForm((current) => ({ ...current, password: value }))}
            />

            {error && <div className="bg-[#fdecef] px-4 py-3 text-sm text-[#b42318]">{error}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 bg-[#3f0e40] px-4 py-3 font-semibold text-white transition hover:bg-[#350d36] disabled:opacity-60"
            >
              {submitting ? 'Signing in...' : 'Sign in'}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#6b6a6b]">
            New here?{' '}
            <Link className="font-semibold text-[#611f69] hover:underline" to="/register">
              Create an account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

const Field = ({ icon, label, value, onChange, type }) => (
  <label className="block">
    <div className="mb-2 text-sm font-medium text-[#1d1c1d]">{label}</div>
    <div className="flex items-center gap-3 border border-black/10 bg-[#fbfbfb] px-4 py-3">
      <span className="text-[#6b6a6b]">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border-0 bg-transparent outline-none"
        required
      />
    </div>
  </label>
);

export default LoginPage;
