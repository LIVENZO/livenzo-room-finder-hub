import { initializeApp, getApps } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

// Firebase configuration is fetched from a Supabase Edge Function to avoid build-time envs
let appInitPromise: Promise<import('firebase/app').FirebaseApp> | null = null;

const fetchFirebaseConfig = async () => {
  const res = await fetch('https://naoqigivttgpkfwpzcgg.supabase.co/functions/v1/get-firebase-config', {
    method: 'GET',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to load Firebase config (${res.status}): ${text}`);
  }
  return res.json();
};

const ensureFirebaseApp = async () => {
  if (getApps().length > 0) return getApps()[0];
  if (!appInitPromise) {
    appInitPromise = (async () => {
      const config = await fetchFirebaseConfig();
      return initializeApp(config);
    })();
  }
  return appInitPromise;
};

// Lazily get auth instance after app is ensured
const getAuthInstance = async () => {
  const app = await ensureFirebaseApp();
  return getAuth(app);
};

// Configure auth for phone authentication (applied when auth is available)
(async () => {
  try {
    const a = await getAuthInstance();
    a.useDeviceLanguage();
  } catch (e) {
    console.warn('Auth initialization deferred:', e);
  }
})();

// Global variables for reCAPTCHA and confirmation
let recaptchaVerifier: RecaptchaVerifier | null = null;
let confirmationResult: ConfirmationResult | null = null;

// Initialize reCAPTCHA
export const initializeRecaptcha = async () => {
  if (recaptchaVerifier) return recaptchaVerifier;

  const auth = await getAuthInstance();
  // Ensure container exists
  const containerId = 'recaptcha-container';
  if (!document.getElementById(containerId)) {
    const div = document.createElement('div');
    div.id = containerId;
    div.style.display = 'none';
    document.body.appendChild(div);
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('reCAPTCHA solved');
    },
    'expired-callback': () => {
      console.log('reCAPTCHA expired');
    },
  });

  await recaptchaVerifier.render();
  return recaptchaVerifier;
};

// Send OTP via Firebase
export const sendFirebaseOTP = async (phoneNumber: string): Promise<void> => {
  try {
    const verifier = await initializeRecaptcha();
    const auth = await getAuthInstance();

    // Expect E.164 formatted phone number (e.g., +919876543210)
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    console.log('OTP sent successfully');
  } catch (error: any) {
    console.error('Error sending OTP:', error);

    // Surface clear Firebase messages
    const code = error?.code;
    const message = error?.message;
    if (code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number format');
    } else if (code === 'auth/too-many-requests') {
      throw new Error('Too many requests. Please try again later.');
    } else if (code === 'auth/quota-exceeded') {
      throw new Error('SMS quota exceeded. Please try again later.');
    } else if (code === 'auth/app-not-authorized') {
      throw new Error('App not authorized for Firebase project. Check Authorized Domains.');
    } else if (code === 'auth/operation-not-allowed') {
      throw new Error('Phone sign-in is disabled in Firebase Auth settings.');
    } else {
      throw new Error(message || 'Failed to send OTP. Please try again.');
    }
  }
};

// Verify OTP via Firebase
export const verifyFirebaseOTP = async (otp: string): Promise<{ uid: string; phoneNumber: string }> => {
  try {
    if (!confirmationResult) {
      throw new Error('No OTP session found. Please request a new OTP.');
    }

    const result = await confirmationResult.confirm(otp);
    const user = result.user;

    if (!user.phoneNumber) {
      throw new Error('Phone number not found in Firebase user');
    }

    return {
      uid: user.uid,
      phoneNumber: user.phoneNumber,
    };
  } catch (error: any) {
    console.error('Error verifying OTP:', error);

    // Handle specific Firebase errors
    const code = error?.code;
    const message = error?.message;
    if (code === 'auth/invalid-verification-code') {
      throw new Error('Invalid OTP. Please check and try again.');
    } else if (code === 'auth/code-expired') {
      throw new Error('OTP has expired. Please request a new one.');
    } else if (code === 'auth/session-expired') {
      throw new Error('Verification session expired. Please request a new OTP.');
    } else {
      throw new Error(message || 'Failed to verify OTP. Please try again.');
    }
  }
};

// Clear confirmation result
export const clearConfirmationResult = () => {
  confirmationResult = null;
};

// Helper to access auth if needed elsewhere (async)
export const getFirebaseAuth = getAuthInstance;