import { ArrowRight, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await authService.register(form);
      navigate('/login');
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Unable to create account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-white items-center justify-center px-6 py-12">
      <div className="grid w-full max-w-6xl overflow-hidden bg-white shadow-[0_18px_60px_rgba(63,14,64,0.12)] border border-black/5 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="bg-[linear-gradient(160deg,#3f0e40,#611f69)] px-10 py-12 text-white">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Build Week</div>
          <h1 className="mt-4 text-4xl font-bold leading-tight">Create your ByteChat workspace identity.</h1>
          <div className="mt-8 space-y-4 text-sm leading-7 text-white/76">
            <p>OWNER and MEMBER roles only.</p>
            <p>Slack-inspired sidebar, conversation canvas, and live collaboration flows.</p>
            <p>JWT access + refresh tokens, STOMP room messaging, direct messages, presence, notifications.</p>
          </div>
        </section>

        <section className="px-8 py-10">
          <div className="mb-8">
            <div className="text-sm font-semibold uppercase tracking-[0.25em] text-[#611f69]">Join ByteChat</div>
            <h2 className="mt-2 text-3xl font-bold text-[#1d1c1d]">Create your account</h2>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <Field
              icon={<UserRound size={16} />}
              label="Display name"
              value={form.displayName}
              onChange={(value) => setForm((current) => ({ ...current, displayName: value }))}
            />
            <Field
              icon={<Mail size={16} />}
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => setForm((current) => ({ ...current, email: value }))}
            />
            <Field
              icon={<LockKeyhole size={16} />}
              label="Password"
              type="password"
              value={form.password}
              onChange={(value) => setForm((current) => ({ ...current, password: value }))}
            />

            {error && <div className="bg-[#fdecef] px-4 py-3 text-sm text-[#b42318]">{error}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 bg-[#3f0e40] px-4 py-3 font-semibold text-white transition hover:bg-[#350d36] disabled:opacity-60"
            >
              {submitting ? 'Creating account...' : 'Create account'}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#6b6a6b]">
            Already have an account?{' '}
            <Link className="font-semibold text-[#611f69] hover:underline" to="/login">
              Sign in
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

const Field = ({ icon, label, value, onChange, type = 'text' }) => (
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

export default RegisterPage;
