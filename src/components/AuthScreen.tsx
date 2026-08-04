import React, { useState, useRef, useEffect } from 'react';
import { 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  Building, 
  AlertCircle, 
  CheckCircle, 
  ShieldCheck, 
  ArrowRight,
  KeyRound,
  RefreshCw,
  Sparkles,
  Globe
} from 'lucide-react';
import { authService, PendingRegistrationData } from '../lib/authService';
import { UserProfile } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (profile: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'verify_otp'>('login');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');

  // OTP Fields
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [pendingOtpData, setPendingOtpData] = useState<PendingRegistrationData | null>(null);
  const [resendCountdown, setResendCountdown] = useState<number>(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isConfigErrorState, setIsConfigErrorState] = useState(false);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (mode === 'verify_otp' && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, resendCountdown]);

  // Handle individual OTP digit change
  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.substring(value.length - 1);
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtpDigits(digits);
      inputRefs.current[5]?.focus();
    }
  };

  // Submit Sign In / Sign Up
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsConfigErrorState(false);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await authService.signIn(email, password);
        if (res.error) {
          setErrorMsg(res.error);
          if (res.isConfigError) {
            setIsConfigErrorState(true);
          }
        } else if (res.user) {
          setSuccessMsg('Sign in successful! Entering portal...');
          setTimeout(() => {
            onAuthSuccess(res.user!);
          }, 400);
        }
      } else if (mode === 'signup') {
        if (!fullName.trim()) {
          setErrorMsg('Please enter your full name');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters long');
          setLoading(false);
          return;
        }

        const res = await authService.signUp(fullName, email, password, companyName);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setPendingOtpData(res.pendingOtp);
          setMode('verify_otp');
          setResendCountdown(30);
          setSuccessMsg(`Verification code generated for ${email.trim()}`);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Submit OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setErrorMsg('Please enter the full 6-digit verification code');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setIsConfigErrorState(false);
    setLoading(true);

    try {
      const res = await authService.verifyOtp(code);
      if (res.error) {
        setErrorMsg(res.error);
        if (res.isConfigError) {
          setIsConfigErrorState(true);
        }
      } else if (res.user) {
        setSuccessMsg('Account created & verified in Firebase! Entering portal...');
        setTimeout(() => {
          onAuthSuccess(res.user!);
        }, 500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to verify OTP code');
    } finally {
      setLoading(false);
    }
  };

  // Google Sign In
  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsConfigErrorState(false);
    setLoading(true);
    try {
      const res = await authService.signInWithGoogle();
      if (res.error) {
        setErrorMsg(res.error);
        if (res.isConfigError) {
          setIsConfigErrorState(true);
        }
      } else if (res.user) {
        setSuccessMsg('Google sign in successful!');
        setTimeout(() => {
          onAuthSuccess(res.user!);
        }, 400);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP code
  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    setErrorMsg('');
    setSuccessMsg('');

    const res = await authService.signUp(fullName, email, password, companyName);
    setPendingOtpData(res.pendingOtp);
    setResendCountdown(30);
    setOtpDigits(['', '', '', '', '', '']);
    setSuccessMsg(`New 6-digit verification code generated for ${email.trim()}`);
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f5f6] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl w-full bg-white rounded-3xl border border-neutral-200/80 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Side Graphic / Intro Panel */}
        <div className="md:col-span-5 bg-neutral-900 text-white p-8 flex flex-col justify-between relative overflow-hidden min-h-[320px] md:min-h-[560px]">
          {/* Subtle background glow circles */}
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-emerald-700/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-emerald-800 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-lg shadow-md">
                S
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight">Client Revenue Tracker</h1>
                <p className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">
                  Firebase Authenticated Portal
                </p>
              </div>
            </div>

            <div className="space-y-3 mt-8">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-900/80 border border-emerald-700/50 text-emerald-300 inline-block">
                Firebase Firestore Cloud Sync
              </span>
              <h2 className="text-xl md:text-2xl font-bold leading-tight">
                Empower your freelance income & client project tracking.
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Log in to sync your client contracts, retainer MRR, and payment histories securely with your personal Firebase database account.
              </p>
            </div>
          </div>

          {/* Bottom Security Badge */}
          <div className="relative z-10 pt-6 border-t border-neutral-800 flex items-center gap-2.5 text-xs text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Encrypted cloud database & user session isolation</span>
          </div>
        </div>

        {/* Right Side Form Panel */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          {mode !== 'verify_otp' ? (
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-100">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </h3>
                <p className="text-xs text-neutral-500">
                  {mode === 'login'
                    ? 'Enter your credentials to access your dashboard'
                    : 'Fill in your details to create your cloud account'}
                </p>
              </div>

              {/* Mode Toggle Buttons */}
              <div className="flex bg-neutral-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    mode === 'login'
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    mode === 'signup'
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6 pb-4 border-b border-neutral-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-900 mb-2">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">
                Email OTP Verification
              </h3>
              <p className="text-xs text-neutral-500">
                Enter the 6-digit verification code generated for{' '}
                <strong className="text-neutral-800">{email || 'your email'}</strong>
              </p>
            </div>
          )}

          {/* Feedback Banners */}
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex flex-col gap-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span>{errorMsg}</span>
                  {isConfigErrorState && (
                    <p className="mt-1 text-[11px] font-normal text-rose-700">
                      To enable Firebase Auth: Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="underline font-bold">Firebase Console</a> &gt; Authentication &gt; Sign-in method &gt; Enable Email/Password or Google.
                    </p>
                  )}
                </div>
              </div>

              {isConfigErrorState && (
                <button
                  type="button"
                  onClick={() => {
                    const localProf = authService.createLocalUserSession(
                      email || 'user@soloclientportal.com',
                      fullName,
                      companyName
                    );
                    onAuthSuccess(localProf);
                  }}
                  className="w-full mt-1 py-2 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Continue with Local Session Fallback</span>
                </button>
              )}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE: VERIFY OTP */}
          {mode === 'verify_otp' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs font-medium space-y-1">
                <div className="flex items-center gap-2 font-bold text-emerald-950">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span>OTP Verification Code</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  A verification code was generated for your email.
                  {pendingOtpData?.otpCode && (
                    <span className="block mt-1 font-mono font-bold text-xs bg-white px-2.5 py-1 rounded-lg border border-emerald-300 w-fit text-emerald-900">
                      Code: {pendingOtpData.otpCode}
                    </span>
                  )}
                </p>
              </div>

              {/* 6 Digit Input Boxes */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-2 text-center">
                  Enter 6-Digit Code
                </label>
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      onPaste={handleDigitPaste}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg font-bold font-mono border-2 border-neutral-200 rounded-2xl focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/20 focus:outline-hidden transition-all bg-neutral-50 focus:bg-white"
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-900 hover:bg-emerald-950 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Creating Firebase Account...</span>
                  ) : (
                    <>
                      <span>Verify Email & Register Firebase Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMsg('');
                    }}
                    className="text-neutral-500 hover:text-neutral-800 font-semibold"
                  >
                    ← Back to Registration
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCountdown > 0}
                    className={`flex items-center gap-1.5 font-bold ${
                      resendCountdown > 0
                        ? 'text-neutral-400 cursor-not-allowed'
                        : 'text-emerald-900 hover:underline'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resendCountdown > 0 ? '' : ''}`} />
                    <span>
                      {resendCountdown > 0
                        ? `Resend code in ${resendCountdown}s`
                        : 'Resend Code'}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* MODE: LOGIN or SIGNUP */
            <form onSubmit={handleSubmitForm} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full pl-10 pr-3 py-2.5 text-xs border border-neutral-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.com"
                    className="w-full pl-10 pr-3 py-2.5 text-xs border border-neutral-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2.5 text-xs border border-neutral-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30 font-mono"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Company / Studio Name (Optional)
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Morgan Creative Studio"
                      className="w-full pl-10 pr-3 py-2.5 text-xs border border-neutral-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-900 hover:bg-emerald-950 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Processing...</span>
                  ) : mode === 'login' ? (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In with Firebase</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Proceed to Email OTP Verification</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-2.5 border border-neutral-300 hover:bg-neutral-50 text-neutral-800 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>Sign In with Google Account</span>
                </button>
              </div>

              {/* Quick Fill / Demo Credentials */}
              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-[11px] text-neutral-400">Need demo login values?</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('demo@soloclientportal.com');
                    setPassword('demopass123');
                    setMode('login');
                  }}
                  className="text-[11px] font-bold text-emerald-900 hover:underline"
                >
                  Use Demo Credentials
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
