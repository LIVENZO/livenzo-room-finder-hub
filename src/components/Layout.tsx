
import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import NavBar from './navigation/NavBar';
import SideBar from './navigation/SideBar';

interface LayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, hideNav = false }) => {
  const isMobile = useIsMobile();
  
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
        "flex-1 bg-gradient-radial w-full",
        isMobile ? "pt-16 pb-20 px-3 sm:px-4" : "ml-[280px] px-6"
      )}>
        <div className="relative max-w-full overflow-hidden">
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
