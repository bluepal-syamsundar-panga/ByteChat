import { ArrowRight, LockKeyhole, Mail, UserRound, ArrowLeft, SendHorizontal, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import useToastStore from '../store/toastStore';

const RegisterPage = () => {
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);
  const [step, setStep] = useState(1); // 1: Info, 2: OTP
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    otpCode: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validateStep1 = () => {
    const newErrors = {};
    if (!form.displayName.trim()) newErrors.displayName = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email format';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 6) newErrors.password = 'Min. 6 characters required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!form.otpCode.trim()) newErrors.otpCode = 'Code is required';
    else if (form.otpCode.length !== 6) newErrors.otpCode = 'Code must be 6 digits';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleSendOtp(event) {
    if (event) event.preventDefault();
    if (!validateStep1()) return;

    setSubmitting(true);
    setErrors({});

    try {
      await authService.sendRegistrationOtp(form.email);
      addToast('Verification code sent to your email');
      setStep(2);
    } catch (requestError) {
      const data = requestError.response?.data;
      if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        setErrors(data.data);
      } else {
        const msg = data?.message ?? 'Unable to send OTP';
        setErrors({ global: msg });
        if (msg.toLowerCase().includes('email')) setErrors({ email: msg });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validateStep2()) return;

    setSubmitting(true);
    setErrors({});

    try {
      await authService.register(form);
      addToast('Account created successfully! Please sign in.');
      navigate('/login');
    } catch (requestError) {
      const data = requestError.response?.data;
      if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        setErrors(data.data);
      } else {
        const msg = data?.message ?? 'Unable to create account';
        if (msg.toLowerCase().includes('otp')) {
          setErrors({ otpCode: msg });
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
      {/* Left side: branding/visual */}
      <section className="hidden lg:flex lg:flex-1 bg-[linear-gradient(135deg,#3f0e40_0%,#611f69_100%)] p-20 flex-col justify-center text-white relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10 max-w-xl">
          <div className="text-sm font-bold uppercase tracking-[0.4em] text-white/50 mb-8">ByteChat Platform</div>
          <h1 className="text-7xl font-extrabold leading-[1.1] tracking-tight">
            Connect your <br />
            <span className="text-white/60">teams in one</span> <br />
            powerful space.
          </h1>
        </div>
      </section>

      {/* Right side: Form (Half Page) */}
      <section className="flex-1 flex flex-col justify-center items-center p-8 lg:p-20 relative bg-white overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-md">
          {/* Heading inside the section */}
          <div className="mb-8">
            <h2 className="text-4xl font-extrabold text-[#1d1c1d] tracking-tight">Join the workspace</h2>
          </div>

          <div className="w-full">
            {step === 1 ? (
              <form className="space-y-5" onSubmit={handleSendOtp} autoComplete="off" noValidate>
                <Field
                  icon={<UserRound size={18} />}
                  label="What should we call you?"
                  placeholder="e.g. John Doe"
                  value={form.displayName}
                  error={errors.displayName}
                  required
                  onChange={(v) => setForm(f => ({ ...f, displayName: v }))}
                />
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
                <Field
                  icon={<LockKeyhole size={18} />}
                  label="Choose a password"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  error={errors.password}
                  required
                  onChange={(v) => setForm(f => ({ ...f, password: v }))}
                />

                {errors.global && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-600 animate-in fade-in zoom-in-95 duration-200">
                    {errors.global}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-14 bg-[#3f0e40] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#2d0a2d] transition-all transform active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-[#3f0e40]/20"
                >
                  {submitting ? 'Sending code...' : 'Continue'}
                  <ArrowRight size={18} />
                </button>
              </form>
            ) : (
              <form className="space-y-5 animate-in slide-in-from-right-4 duration-300" onSubmit={handleSubmit} autoComplete="off" noValidate>
                <div className="mb-4">
                  <p className="text-sm text-[#6b6a6b] mb-1">We sent a 6-digit code to</p>
                  <p className="font-bold text-[#1d1c1d]">{form.email}</p>
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="mt-2 text-xs font-bold text-[#611f69] hover:underline flex items-center gap-1"
                  >
                    <ArrowLeft size={12} /> Change email
                  </button>
                </div>

                <Field
                  icon={<SendHorizontal size={18} />}
                  label="Verification Code"
                  placeholder="Enter 6-digit code"
                  value={form.otpCode}
                  error={errors.otpCode}
                  required
                  maxLength={6}
                  onChange={(v) => setForm(f => ({ ...f, otpCode: v }))}
                />

                {errors.global && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-600">
                    {errors.global}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-14 bg-[#3f0e40] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#2d0a2d] transition-all shadow-lg shadow-[#3f0e40]/20"
                >
                  {submitting ? 'Verifying...' : 'Complete registration'}
                  <ArrowRight size={18} />
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={submitting}
                    className="text-xs font-bold text-[#611f69] hover:opacity-70 disabled:opacity-30"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            )}
          </div>

          <p className="mt-12 text-sm font-medium text-[#6b6a6b]">
            Already using ByteChat?{' '}
            <Link to="/login" className="text-[#611f69] font-bold hover:underline">
              Sign in to your workspace
            </Link>
          </p>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
        body { overflow: hidden; }
      `}} />
    </div>
  );
};

const Field = ({ icon, label, value, onChange, type = 'text', placeholder, error, maxLength, required }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <>
      {isPassword && (
        <style>{`
          .hide-password-reveal::-ms-reveal,
          .hide-password-reveal::-ms-clear {
            display: none;
          }
          .hide-password-reveal::-webkit-credentials-auto-fill-button {
            visibility: hidden;
            display: none !important;
            pointer-events: none;
          }
        `}</style>
      )}
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
            type={type === 'email' ? 'text' : inputType}
            name={`${label.replace(/\s+/g, '-').toLowerCase()}-${type}`}
            value={value}
            placeholder={placeholder}
            maxLength={maxLength}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            inputMode={type === 'email' ? 'email' : undefined}
            spellCheck={false}
            onChange={(event) => onChange(event.target.value)}
            className={`w-full h-14 bg-transparent outline-none text-[#1d1c1d] font-medium placeholder:text-[#6b6a6b]/40 ${isPassword ? 'hide-password-reveal' : ''}`}
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
    </>
  );
};

export default RegisterPage;
