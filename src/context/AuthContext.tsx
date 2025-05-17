
// This file is just a re-export for backward compatibility
// All components should migrate to using the new imports from '@/context/auth'
export { AuthProvider, AuthContext, useAuth } from './auth';
export type { AuthContextType } from './auth/types';
