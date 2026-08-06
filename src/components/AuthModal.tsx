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
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isConfigErrorState, setIsConfigErrorState] = useState(false);

  if (!isOpen) return null;

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

          <div className="w-10 h-10 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center mb-3 p-1 overflow-hidden shadow-xs shrink-0">
            <img
              src="https://i.postimg.cc/kMbf5XhW/logo.png"
              alt="Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <h2 className="text-lg font-bold">
            Account Sign In
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Sign in with Google to access your account & database records
          </p>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          {/* Registration Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-medium space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <span>New Registrations Disabled</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              New user sign-ups are currently closed. Only pre-registered existing user accounts can sign in.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span>{errorMsg}</span>
                  {isConfigErrorState && (
                    <p className="mt-1 text-[11px] text-rose-700">
                      Enable Google under Authentication &gt; Sign-in method in Firebase Console.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2.5"
            >
              <Globe className="w-4 h-4 text-emerald-300" />
              <span>{loading ? 'Signing in...' : 'Sign In with Google'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
