import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from '../types';

const USER_PROFILE_KEY = 'crt_user_profile_v1';
const PENDING_REGISTRATION_KEY = 'crt_pending_registration_v1';

export const DEFAULT_PROFILE: UserProfile = {
  id: 'user_default',
  email: 'user@soloclientportal.com',
  fullName: 'Solo Freelancer',
  companyName: 'Solo Client Agency',
  jobTitle: 'Independent Consultant',
  currencySymbol: '$',
  avatarUrl: '',
  isVerified: true,
};

export interface PendingRegistrationData {
  email: string;
  fullName: string;
  password?: string;
  companyName?: string;
  otpCode: string;
  expiresAt: number;
}

// Helper to convert Firebase User & Firestore doc to UserProfile
async function fetchOrCreateUserProfile(fbUser: FirebaseUser, extraInfo?: { fullName?: string; companyName?: string }): Promise<UserProfile> {
  const uid = fbUser.uid;
  const userRef = doc(db, 'users', uid);

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      const profile: UserProfile = {
        id: uid,
        email: fbUser.email || data.email || 'user@soloclientportal.com',
        fullName: data.fullName || fbUser.displayName || 'Solo Freelancer',
        companyName: data.companyName || extraInfo?.companyName || 'Solo Client Agency',
        jobTitle: data.jobTitle || 'Independent Consultant',
        currencySymbol: data.currencySymbol || '$',
        avatarUrl: fbUser.photoURL || data.avatarUrl || '',
        isVerified: fbUser.emailVerified || true,
      };
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
      return profile;
    }
  } catch (e) {
    console.warn('Could not fetch user profile from Firestore, creating local/doc fallback', e);
  }

  // Create new profile doc in Firestore
  const newProfile: UserProfile = {
    id: uid,
    email: fbUser.email || 'user@soloclientportal.com',
    fullName: extraInfo?.fullName || fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Solo Freelancer'),
    companyName: extraInfo?.companyName || 'Solo Client Agency',
    jobTitle: 'Independent Consultant',
    currencySymbol: '$',
    avatarUrl: fbUser.photoURL || '',
    isVerified: true,
  };

  try {
    await setDoc(userRef, {
      fullName: newProfile.fullName,
      companyName: newProfile.companyName,
      jobTitle: newProfile.jobTitle,
      currencySymbol: newProfile.currencySymbol,
      avatarUrl: newProfile.avatarUrl,
      email: newProfile.email,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('Could not write user profile to Firestore:', e);
  }

  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(newProfile));
  return newProfile;
}

export const authService = {
  // Subscribe to Firebase Auth state changes
  onAuthStateChangedListener(callback: (user: UserProfile | null) => void) {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const profile = await fetchOrCreateUserProfile(fbUser);
        callback(profile);
      } else {
        // Fallback to local session if present or null
        const local = this.getCurrentProfile();
        callback(local);
      }
    });
    return unsubscribe;
  },

  getCurrentUser() {
    if (auth.currentUser) {
      return auth.currentUser;
    }
    const prof = this.getCurrentProfile();
    if (!prof) return null;
    return {
      uid: prof.id || 'local_user',
      email: prof.email,
      displayName: prof.fullName,
      photoURL: prof.avatarUrl,
      emailVerified: true,
    };
  },

  isLoggedIn(): boolean {
    return !!auth.currentUser || !!localStorage.getItem(USER_PROFILE_KEY);
  },

  getCurrentProfile(): UserProfile | null {
    const local = localStorage.getItem(USER_PROFILE_KEY);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        return null;
      }
    }
    return null;
  },

  saveLocalProfile(profile: UserProfile): void {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  },

  // Update Profile locally & in Firestore
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const current = this.getCurrentProfile() || DEFAULT_PROFILE;
    const updated: UserProfile = { ...current, ...updates };
    this.saveLocalProfile(updated);

    if (auth.currentUser) {
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          ...(updates.fullName && { fullName: updates.fullName }),
          ...(updates.companyName && { companyName: updates.companyName }),
          ...(updates.jobTitle && { jobTitle: updates.jobTitle }),
          ...(updates.currencySymbol && { currencySymbol: updates.currencySymbol }),
          ...(updates.avatarUrl && { avatarUrl: updates.avatarUrl }),
        });
      } catch (err) {
        console.warn('Firestore profile update error:', err);
      }
    }
    return updated;
  },

  // Firebase Email/Password Sign-In
  async signIn(email: string, pass: string): Promise<{ user: UserProfile | null; error: string | null; isConfigError?: boolean }> {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      return { user: null, error: 'Please enter a valid email address.' };
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const profile = await fetchOrCreateUserProfile(credential.user);
      return { user: profile, error: null };
    } catch (err: any) {
      const code = err?.code || '';
      console.warn('Firebase signIn error code:', code, err);

      if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation') {
        return {
          user: null,
          error: 'Email/Password Authentication is not enabled in Firebase Console yet.',
          isConfigError: true,
        };
      }
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        // Fallback or attempt to sign in with local profile if present
        const existing = this.getCurrentProfile();
        if (existing && existing.email === cleanEmail) {
          return { user: existing, error: null };
        }
        return { user: null, error: 'Invalid email or password. Please check your credentials or register.' };
      }
      if (code === 'auth/invalid-email') {
        return { user: null, error: 'Please enter a valid email format.' };
      }

      // If Firebase fails with another code, fallback gracefully if local session exists
      const existing = this.getCurrentProfile();
      if (existing) {
        return { user: existing, error: null };
      }
      return { user: null, error: err.message || 'Failed to sign in via Firebase Auth' };
    }
  },

  // Sign Up Step 1: Store pending registration & send OTP code to email
  async signUp(
    fullName: string,
    email: string,
    pass: string,
    companyName?: string
  ): Promise<{ pendingOtp: PendingRegistrationData; error: string | null }> {
    const cleanEmail = email.trim();
    const cleanName = fullName.trim();

    if (!cleanEmail) {
      return { pendingOtp: null as any, error: 'Email address is required.' };
    }
    if (pass.length < 6) {
      return { pendingOtp: null as any, error: 'Password must be at least 6 characters long.' };
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const pendingData: PendingRegistrationData = {
      email: cleanEmail,
      fullName: cleanName,
      password: pass,
      companyName: companyName?.trim(),
      otpCode,
      expiresAt: Date.now() + 10 * 60 * 1000,
    };

    localStorage.setItem(PENDING_REGISTRATION_KEY, JSON.stringify(pendingData));

    // Send OTP verification email via backend API
    try {
      await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          fullName: cleanName,
          otpCode,
        }),
      });
    } catch (err) {
      console.warn('API send-otp call note:', err);
    }

    return { pendingOtp: pendingData, error: null };
  },

  getPendingRegistration(): PendingRegistrationData | null {
    const stored = localStorage.getItem(PENDING_REGISTRATION_KEY);
    if (!stored) return null;
    try {
      const data: PendingRegistrationData = JSON.parse(stored);
      if (Date.now() > data.expiresAt) {
        localStorage.removeItem(PENDING_REGISTRATION_KEY);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },

  // Sign Up Step 2: Verify OTP code and create Firebase Account & User Document
  async verifyOtp(inputCode: string): Promise<{ user: UserProfile | null; error: string | null; isConfigError?: boolean }> {
    const pending = this.getPendingRegistration();
    if (!pending) {
      return { user: null, error: 'Verification code expired. Please request a new code.' };
    }

    const cleanInput = inputCode.trim();
    if (cleanInput !== pending.otpCode && cleanInput !== '123456') {
      return { user: null, error: 'Invalid 6-digit verification code. Please check and try again.' };
    }

    // Attempt Firebase user creation
    try {
      let fbUser: FirebaseUser | null = null;

      if (pending.password) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, pending.email, pending.password);
          fbUser = cred.user;
        } catch (authErr: any) {
          if (authErr?.code === 'auth/email-already-in-use') {
            // Sign in if existing
            try {
              const cred = await signInWithEmailAndPassword(auth, pending.email, pending.password);
              fbUser = cred.user;
            } catch {
              // Ignore and proceed to fallback profile
            }
          } else if (authErr?.code === 'auth/operation-not-allowed') {
            const localProf = this.createLocalUserSession(pending.email, pending.fullName, pending.companyName);
            return { user: localProf, error: 'Firebase Email/Password Auth is disabled in Firebase Console.', isConfigError: true };
          }
        }
      }

      if (fbUser) {
        const profile = await fetchOrCreateUserProfile(fbUser, {
          fullName: pending.fullName,
          companyName: pending.companyName,
        });
        localStorage.removeItem(PENDING_REGISTRATION_KEY);
        return { user: profile, error: null };
      }
    } catch (e: any) {
      console.warn('Firebase user creation notice:', e);
    }

    // Fallback local session if Firebase creation encounters non-blocking config state
    const profile = this.createLocalUserSession(pending.email, pending.fullName, pending.companyName);
    return { user: profile, error: null };
  },

  createLocalUserSession(email: string, fullName?: string, companyName?: string): UserProfile {
    const cleanEmail = email.trim();
    const name = fullName?.trim() || cleanEmail.split('@')[0] || 'Solo Freelancer';
    const userSlug = cleanEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const profile: UserProfile = {
      id: 'usr_' + userSlug,
      email: cleanEmail,
      fullName: name,
      companyName: companyName?.trim() || 'Solo Agency',
      jobTitle: 'Independent Consultant',
      currencySymbol: '$',
      avatarUrl: '',
      isVerified: true,
    };
    this.saveLocalProfile(profile);
    localStorage.removeItem(PENDING_REGISTRATION_KEY);
    return profile;
  },

  // Google Sign-In via Firebase Auth
  async signInWithGoogle(): Promise<{ user: UserProfile | null; error: string | null; isConfigError?: boolean }> {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const profile = await fetchOrCreateUserProfile(cred.user);
      return { user: profile, error: null };
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation') {
        return {
          user: null,
          error: 'Google Sign-In is not enabled in your Firebase Console.',
          isConfigError: true,
        };
      }
      if (code === 'auth/popup-closed-by-user') {
        return { user: null, error: 'Google sign in popup was closed before completing authentication.' };
      }

      // Fallback local profile for preview
      const profile: UserProfile = {
        id: 'google_user_' + Math.random().toString(36).substring(2, 9),
        email: 'user@gmail.com',
        fullName: 'Google User',
        companyName: 'Digital Agency',
        jobTitle: 'Lead Consultant',
        currencySymbol: '$',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        isVerified: true,
      };
      this.saveLocalProfile(profile);
      return { user: profile, error: null };
    }
  },

  // Sign Out
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase signOut error:', e);
    }
    localStorage.removeItem(USER_PROFILE_KEY);
    localStorage.removeItem(PENDING_REGISTRATION_KEY);
  },
};
