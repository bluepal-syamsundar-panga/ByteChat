import { ArrowRight, LockKeyhole, Mail, ArrowLeft, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';

const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const addToast = useToastStore((state) => state.addToast);
  
  const [mode, setMode] = useState('login'); // login, forgot-email, forgot-otp, forgot-reset
  const [form, setForm] = useState({ email: '', password: '', otpCode: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validateLogin = () => {
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = 'Email is required';
    if (!form.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForgotEmail = () => {
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email format';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOtp = () => {
    const newErrors = {};
    if (!form.otpCode.trim()) newErrors.otpCode = 'Code is required';
    else if (form.otpCode.length !== 6) newErrors.otpCode = 'Code must be 6 digits';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateResetPassword = () => {
    const newErrors = {};
    if (!form.newPassword) newErrors.newPassword = 'New password is required';
    else if (form.newPassword.length < 6) newErrors.newPassword = 'Min. 6 characters required';
    
    if (!form.confirmPassword) newErrors.confirmPassword = 'Please confirm password';
    else if (form.newPassword !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleLogin(event) {
    event.preventDefault();
    if (!validateLogin()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const response = await authService.login({
        email: form.email,
        password: form.password
      });
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
      addToast('Welcome back, ' + payload.displayName + '!');
      navigate('/');
    } catch (requestError) {
      const data = requestError.response?.data;
      if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        setErrors(data.data);
      } else {
        const msg = data?.message ?? 'Unable to sign in';
        setErrors({ global: msg });
        if (msg.toLowerCase().includes('password')) setErrors({ password: msg });
        if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('user')) setErrors({ email: msg });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendResetOtp(event) {
    event.preventDefault();
    if (!validateForgotEmail()) return;

    setSubmitting(true);
    setErrors({});

    try {
      await authService.sendForgotPasswordOtp(form.email);
      addToast('Password reset code sent to your email');
      setMode('forgot-otp');
    } catch (requestError) {
      const data = requestError.response?.data;
      if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        setErrors(data.data);
      } else {
        setErrors({ email: data?.message ?? 'Unable to send OTP' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();
    if (!validateOtp()) return;
    setMode('forgot-reset');
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    if (!validateResetPassword()) return;

    setSubmitting(true);
    setErrors({});

    try {
      await authService.resetPassword({
        email: form.email,
        code: form.otpCode,
        newPassword: form.newPassword
      });
      addToast('Password reset successfully! You can now sign in.');
      setMode('login');
      setForm(f => ({ ...f, password: '', otpCode: '', newPassword: '', confirmPassword: '' }));
    } catch (requestError) {
      const data = requestError.response?.data;
      if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        setErrors(data.data);
      } else {
        const msg = data?.message ?? 'Reset failed';
        if (msg.toLowerCase().includes('otp')) {
          setErrors({ otpCode: msg });
          setMode('forgot-otp');
        } else {
          setErrors({ global: msg });
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Visual Side */}
      <section className="hidden lg:flex lg:flex-1 bg-[linear-gradient(135deg,#1d1c1d_0%,#3f0e40_100%)] p-20 flex-col justify-center text-white relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-2xl font-black text-[#3f0e40]">B</span>
            </div>
            <span className="text-2xl font-black tracking-tight">ByteChat</span>
          </div>
          <h1 className="text-7xl font-extrabold leading-[1.1] tracking-tight">
            Sign in to <br />
            <span className="text-white/60">your digital</span> <br />
            headquarters.
          </h1>
        </div>
      </section>

      {/* Auth Side (Half Page) */}
      <section className="flex-1 flex flex-col justify-center items-center p-8 lg:p-20 relative bg-white overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-sm">
          {mode === 'login' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6">
                <h2 className="text-4xl font-black text-[#1d1c1d] tracking-tight">Welcome back</h2>
                <p className="mt-2 text-[#6b6a6b] font-medium">Sign in to continue chatting</p>
              </div>

              <form className="space-y-4" onSubmit={handleLogin} autoComplete="off">
                <Field
                  icon={<Mail size={18} />}
                  label="Email address"
                  type="email"
                  placeholder="name@work.com"
                  value={form.email}
                  error={errors.email}
                  required
                  onChange={(v) => setForm(f => ({ ...f, email: v }))}
                />
                
                <div>
                  <Field
                    icon={<LockKeyhole size={18} />}
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    value={form.password}
                    error={errors.password}
                    required
                    onChange={(v) => setForm(f => ({ ...f, password: v }))}
                  />
                  <div className="flex justify-end mt-2">
                    <button 
                      type="button" 
                      onClick={() => setMode('forgot-email')}
                      className="text-xs font-bold text-[#611f69] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                {errors.global && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-600 animate-in shake-in">
                    {errors.global}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-14 bg-[#3f0e40] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#2d0a2d] transition-all transform active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-[#3f0e40]/20"
                >
                  {submitting ? 'Authenticating...' : 'Sign In'}
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>
          )}

          {mode === 'forgot-email' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button 
                onClick={() => setMode('login')}
                className="mb-8 flex items-center gap-2 text-sm font-bold text-[#6b6a6b] hover:text-[#3f0e40] transition-colors"
              >
                <ArrowLeft size={16} /> Back to Sign In
              </button>
              
              <div className="mb-6">
                <h2 className="text-3xl font-black text-[#1d1c1d] tracking-tight">Reset password</h2>
                <p className="mt-2 text-[#6b6a6b] font-medium leading-relaxed">
                  Enter your email address and we'll send you a code to reset your password.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSendResetOtp} autoComplete="off">
                <Field
                  icon={<Mail size={18} />}
                  label="Email address"
                  type="email"
                  placeholder="Enter your workspace email"
                  value={form.email}
                  error={errors.email}
                  required
                  onChange={(v) => setForm(f => ({ ...f, email: v }))}
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-14 bg-[#3f0e40] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#2d0a2d] transition-all shadow-lg"
                >
                  {submitting ? 'Sending code...' : 'Send reset code'}
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>
          )}

          {mode === 'forgot-otp' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button 
                onClick={() => setMode('forgot-email')}
                className="mb-8 flex items-center gap-2 text-sm font-bold text-[#6b6a6b] hover:text-[#3f0e40] transition-colors"
              >
                <ArrowLeft size={16} /> Back
              </button>

              <div className="mb-6">
                <h2 className="text-3xl font-black text-[#1d1c1d] tracking-tight">Enter code</h2>
                <p className="mt-2 text-[#6b6a6b] font-medium leading-relaxed">
                  We've sent a 6-digit code to <span className="font-bold">{form.email}</span>
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleVerifyOtp} autoComplete="off">
                <Field
                  icon={<KeyRound size={18} />}
                  label="Verification Code"
                  placeholder="6-digit code"
                  maxLength={6}
                  value={form.otpCode}
                  error={errors.otpCode}
                  required
                  onChange={(v) => setForm(f => ({ ...f, otpCode: v }))}
                />

                <button
                  type="submit"
                  className="w-full h-14 bg-[#3f0e40] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#2d0a2d] transition-all shadow-lg"
                >
                  Verify Code
                  <ArrowRight size={18} />
                </button>
                
                <button 
                  type="button"
                  onClick={handleSendResetOtp}
                  disabled={submitting}
                  className="w-full text-center text-xs font-bold text-[#6b6a6b] hover:text-[#3f0e40]"
                >
                  Didn't get the code? Resend
                </button>
              </form>
            </div>
          )}

          {mode === 'forgot-reset' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-6">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-5">
                  <CheckCircle2 size={28} className="text-emerald-500" />
                </div>
                <h2 className="text-3xl font-black text-[#1d1c1d] tracking-tight">New password</h2>
                <p className="mt-2 text-[#6b6a6b] font-medium">
                  Create a secure password for your account.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleResetPassword} autoComplete="off">
                <Field
                  icon={<LockKeyhole size={18} />}
                  label="New Password"
                  type="password"
                  placeholder="Enter new password"
                  value={form.newPassword}
                  error={errors.newPassword}
                  required
                  onChange={(v) => setForm(f => ({ ...f, newPassword: v }))}
                />
                <Field
                  icon={<LockKeyhole size={18} />}
                  label="Confirm Password"
                  type="password"
                  placeholder="Repeat new password"
                  value={form.confirmPassword}
                  error={errors.confirmPassword}
                  required
                  onChange={(v) => setForm(f => ({ ...f, confirmPassword: v }))}
                />

                {errors.global && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-600">
                    {errors.global}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                >
                  {submitting ? 'Updating...' : 'Complete Reset'}
                  <CheckCircle2 size={18} />
                </button>
              </form>
            </div>
          )}

          <div className="mt-10 border-t border-black/5 pt-10 text-center">
            <p className="text-sm font-medium text-[#6b6a6b]">
              {mode === 'login' ? "New to ByteChat?" : "Already have an account?"}{' '}
              {mode === 'login' ? (
                <Link to="/register" className="text-[#611f69] font-bold hover:underline">Create an account</Link>
              ) : (
                <button onClick={() => setMode('login')} className="text-[#611f69] font-bold hover:underline">Sign in</button>
              )}
            </p>
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
        body { overflow: hidden; }
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .shake-in { animation: shake 0.2s ease-in-out 0s 2; }
      `}} />
    </div>
  );
};

const Field = ({ icon, label, value, onChange, type = 'text', placeholder, error, maxLength, required }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full group">
      <div className="mb-2 px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-[#6b6a6b] group-focus-within:text-[#3f0e40] transition-colors">
          {label} {required && <span className="text-rose-500 ml-0.5">**</span>}
        </span>
      </div>
      <div className={`
        flex items-center gap-3 bg-[#f8f8f8] border-[1.5px] rounded-2xl px-5 transition-all duration-200
        ${error ? 'border-rose-200 bg-rose-50/30' : 'border-transparent group-focus-within:border-[#3f0e40]/20 group-focus-within:bg-white'}
      `}>
        <span className={`${error ? 'text-rose-400' : 'text-[#6b6a6b] group-focus-within:text-[#3f0e40]'} transition-colors`}>{icon}</span>
        <input
          type={inputType}
          name={`${label.replace(/\s+/g, '-').toLowerCase()}-${type}`}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
          className="w-full h-14 bg-transparent outline-none text-[#1d1c1d] font-medium placeholder:text-[#6b6a6b]/40"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-[#6b6a6b] hover:text-[#3f0e40] transition-colors focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <div className="mt-1.5 px-1 text-[10px] font-bold text-rose-500 animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}
    </div>
  );
};

export default LoginPage;
