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
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isConfigErrorState, setIsConfigErrorState] = useState(false);

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

  return (
    <div className="min-h-screen w-full bg-[#f4f5f6] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl w-full bg-white rounded-3xl border border-neutral-200/80 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Side Graphic / Intro Panel */}
        <div className="md:col-span-5 bg-neutral-900 text-white p-8 flex flex-col justify-between relative overflow-hidden min-h-[320px] md:min-h-[520px]">
          {/* Subtle background glow circles */}
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-emerald-700/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center p-1 overflow-hidden shadow-md shrink-0">
                <img
                  src="https://i.postimg.cc/kMbf5XhW/logo.png"
                  alt="Client Revenue Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight">Client Revenue Tracker</h1>
                <p className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">
                  Google Authenticated Portal
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
                Log in to sync your client contracts, retainer MRR, and payment histories securely with your Google account.
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
          <div className="mb-6 pb-4 border-b border-neutral-100">
            <h3 className="text-lg font-bold text-neutral-900">
              Sign In to Portal
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Google authentication is enabled for authorized existing accounts.
            </p>
          </div>

          {/* Registration Disabled Notice Pill */}
          <div className="mb-6 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-medium space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <Lock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>New Registrations Closed</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              New user sign-ups are currently disabled. Only existing pre-authorized accounts can log in.
            </p>
          </div>

          {/* Feedback Banners */}
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex flex-col gap-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span>{errorMsg}</span>
                  {isConfigErrorState && (
                    <p className="mt-1 text-[11px] font-normal text-rose-700">
                      To enable Google Auth: Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="underline font-bold">Firebase Console</a> &gt; Authentication &gt; Sign-in method &gt; Enable Google.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Google Sign-In Primary Action */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-emerald-900 hover:bg-emerald-950 active:bg-emerald-950 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-3 group"
            >
              <Globe className="w-5 h-5 text-emerald-300 group-hover:scale-110 transition-transform" />
              <span>{loading ? 'Authenticating with Google...' : 'Sign In with Google Account'}</span>
            </button>
          </div>

          <div className="mt-8 pt-4 border-t border-neutral-100 text-center">
            <p className="text-[11px] text-neutral-400">
              Client Revenue Tracker • Google Authentication Engine
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
