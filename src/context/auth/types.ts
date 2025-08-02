
import { Session, User } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (provider: string, selectedRole?: string) => void;
  logout: () => void;
  signInWithPassword: (email: string, password: string, selectedRole?: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string, selectedRole?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  session: Session | null;
  userRole: string | null;
  isOwner: boolean;
  currentUser: User | null;
  canChangeRole: boolean;
  checkRoleConflict?: (user: User, selectedRole: string) => Promise<boolean>;
}
