import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFirebaseAuth } from '@/context/auth/FirebaseAuthProvider';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import NavBar from './navigation/NavBar';
import SideBar from './navigation/SideBar';

interface LayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
  requireAuth?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, hideNav = false, requireAuth = false }) => {
  const isMobile = useIsMobile();
  const { user, isLoading } = useFirebaseAuth();

  // Check authentication if required
  if (requireAuth) {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }

    if (!user) {
      return <Navigate to="/" replace />;
    }
  }
  
  // Render nothing if hideNav is true
  if (hideNav) {
    return <>{children}</>;
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-radial font-sans">
      {/* Mobile navigation */}
      {isMobile && <NavBar />}
      
      {/* Desktop sidebar */}
      {!isMobile && <SideBar />}
      
      {/* Main content */}
      <main className={cn(
        "flex-1 bg-gradient-radial w-full h-full",
        isMobile ? "pt-16 pb-20" : "ml-[280px]"
      )}>
        <div className="relative w-full h-full overflow-hidden">
          {/* Subtle background pattern - hidden on mobile for performance */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none hidden md:block">
            <div className="absolute top-20 left-1/4 w-64 h-64 bg-primary-300 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-secondary-300 rounded-full blur-3xl"></div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;