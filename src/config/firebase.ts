import { initializeApp, getApps } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

// Firebase configuration will be loaded from environment or fallback
const getFirebaseConfig = () => {
  try {
    // In production, this will come from environment variables
    // For development, we'll use a default config structure
    const configString = import.meta.env.VITE_FIREBASE_CONFIG;
    if (configString) {
      return JSON.parse(configString);
    }
  } catch (error) {
    console.warn('Failed to parse Firebase config from environment');
  }
  
  // Fallback config for development
  return {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
  };
};

// Initialize Firebase
const firebaseConfig = getFirebaseConfig();
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

// Configure auth for phone authentication
auth.useDeviceLanguage();

// Global variables for reCAPTCHA and confirmation
let recaptchaVerifier: RecaptchaVerifier | null = null;
let confirmationResult: ConfirmationResult | null = null;

// Initialize reCAPTCHA
export const initializeRecaptcha = () => {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': () => {
        console.log('reCAPTCHA solved');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      }
    });
  }
  return recaptchaVerifier;
};

// Send OTP via Firebase
export const sendFirebaseOTP = async (phoneNumber: string): Promise<void> => {
  try {
    const verifier = initializeRecaptcha();
    const fullPhoneNumber = `+91${phoneNumber}`;
    
    confirmationResult = await signInWithPhoneNumber(auth, fullPhoneNumber, verifier);
    console.log('OTP sent successfully');
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number format');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many requests. Please try again later.');
    } else if (error.code === 'auth/quota-exceeded') {
      throw new Error('SMS quota exceeded. Please try again later.');
    } else {
      throw new Error('Failed to send OTP. Please try again.');
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
      phoneNumber: user.phoneNumber
    };
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid OTP. Please check and try again.');
    } else if (error.code === 'auth/code-expired') {
      throw new Error('OTP has expired. Please request a new one.');
    } else {
      throw new Error(error.message || 'Failed to verify OTP. Please try again.');
    }
  }
};

// Clear confirmation result
export const clearConfirmationResult = () => {
  confirmationResult = null;
};

export { auth };