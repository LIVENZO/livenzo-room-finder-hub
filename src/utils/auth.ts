import { User as FirebaseUser } from 'firebase/auth';

/**
 * Check if user is authenticated using Firebase
 */
export const isAuthenticated = (user: FirebaseUser | null): boolean => {
  return user !== null;
};

/**
 * Get current Firebase user ID
 */
export const getCurrentUserId = (user: FirebaseUser | null): string | null => {
  return user?.uid || null;
};

/**
 * Get current Firebase user phone number
 */
export const getCurrentUserPhone = (user: FirebaseUser | null): string | null => {
  return user?.phoneNumber || null;
};

/**
 * Check if current user is owner based on role
 */
export const isOwner = (userRole: string | null): boolean => {
  return userRole === 'owner';
};

/**
 * Check if current user is renter based on role
 */
export const isRenter = (userRole: string | null): boolean => {
  return userRole === 'renter';
};