
import { Session, User } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (provider: string, selectedRole?: string) => void;
  logout: () => void;
  session: Session | null;
  userRole: string | null;
  isOwner: boolean;
  currentUser: User | null;
  canChangeRole: boolean;
  checkRoleConflict?: (user: User, selectedRole: string) => Promise<boolean>;
}
