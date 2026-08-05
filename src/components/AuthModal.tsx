import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  Building, 
  AlertCircle, 
  CheckCircle, 
  KeyRound, 
  Sparkles,
  Globe,
  ShieldCheck
} from 'lucide-react';
import { authService, PendingRegistrationData } from '../lib/authService';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
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

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (mode === 'verify_otp' && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, resendCountdown]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.substring(value.length - 1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
          if (res.isConfigError) setIsConfigErrorState(true);
        } else if (res.user) {
          setSuccessMsg('Successfully signed in!');
          setTimeout(() => {
            onAuthSuccess(res.user!);
            onClose();
          }, 400);
        }
      } else if (mode === 'signup') {
        if (!fullName.trim()) {
          setErrorMsg('Please enter your full name');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters');
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
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setErrorMsg('Please enter 6-digit code');
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
        if (res.isConfigError) setIsConfigErrorState(true);
      } else if (res.user) {
        setSuccessMsg('Verified & signed in!');
        setTimeout(() => {
          onAuthSuccess(res.user!);
          onClose();
        }, 500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsConfigErrorState(false);
    setLoading(true);
    try {
      const res = await authService.signInWithGoogle();
      if (res.error) {
        setErrorMsg(res.error);
        if (res.isConfigError) setIsConfigErrorState(true);
      } else if (res.user) {
        setSuccessMsg('Signed in with Google!');
        setTimeout(() => {
          onAuthSuccess(res.user!);
          onClose();
        }, 400);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full border border-neutral-200/80 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-neutral-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-2xl bg-emerald-800/80 border border-emerald-500/30 flex items-center justify-center mb-3 text-emerald-300">
            {mode === 'verify_otp' ? (
              <KeyRound className="w-5 h-5" />
            ) : mode === 'login' ? (
              <LogIn className="w-5 h-5" />
            ) : (
              <UserPlus className="w-5 h-5" />
            )}
          </div>

          <h2 className="text-lg font-bold">
            {mode === 'verify_otp'
              ? 'Verify Email via OTP'
              : mode === 'login'
              ? 'Welcome Back'
              : 'Create New Account'}
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {mode === 'verify_otp'
              ? `Enter the 6-digit code sent to ${email}`
              : mode === 'login'
              ? 'Sign in to access your Firebase cloud data'
              : 'Register your account with Firebase database'}
          </p>

          {/* Mode Switcher */}
          {mode !== 'verify_otp' && (
            <div className="flex bg-neutral-800/80 p-1 rounded-xl mt-4">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  mode === 'login'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'text-neutral-400 hover:text-white'
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
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  mode === 'signup'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>
          )}
        </div>

        {/* Modal Form Content */}
        {mode === 'verify_otp' ? (
          <form onSubmit={handleVerifyOtp} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span>{errorMsg}</span>
                    {isConfigErrorState && (
                      <p className="mt-1 text-[11px] text-rose-700">
                        Enable Email/Password under Authentication &gt; Sign-in method in Firebase Console.
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
                      onClose();
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
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
              <div className="flex items-center gap-1.5 font-bold mb-1 text-emerald-950">
                <Mail className="w-3.5 h-3.5 text-emerald-700" />
                <span>Verification Code Sent</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                A 6-digit code has been sent to <strong>{email || 'your email'}</strong>. Please check your inbox or spam folder.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-2 text-center">
                6-Digit Code
              </label>
              <div className="flex justify-center gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                    className="w-10 h-12 text-center text-base font-bold font-mono border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-800/30 focus:outline-hidden"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying...' : 'Verify Email & Create Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span>{errorMsg}</span>
                    {isConfigErrorState && (
                      <p className="mt-1 text-[11px] text-rose-700">
                        Enable Email/Password or Google under Authentication &gt; Sign-in method in Firebase Console.
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
                      onClose();
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
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30 font-mono"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Company / Studio Name (Optional)
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Morgan Creative Agency"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : mode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Proceed to Verification OTP</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2 border border-neutral-300 hover:bg-neutral-50 text-neutral-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Sign In with Google</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
