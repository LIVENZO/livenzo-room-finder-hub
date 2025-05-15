
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
    <div className="flex flex-col min-h-screen">
      {/* Mobile navigation */}
      {isMobile && <NavBar />}
      
      {/* Desktop sidebar */}
      {!isMobile && <SideBar />}
      
      {/* Main content */}
      <main className={cn(
        "flex-1 bg-gray-50",
        isMobile ? "pt-16 pb-16" : "ml-[240px]"
      )}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
