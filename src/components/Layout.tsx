
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Home,
  Search,
  PlusSquare,
  Heart,
  Calendar,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { useAuth } from '@/context/AuthContext';
import { useMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, hideNav = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isGuestMode, logout, userRole } = useAuth();
  const isMobile = useMobile();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  // Navigation items
  const navItems = [
    {
      label: 'Home',
      icon: <Home size={20} />,
      href: '/dashboard',
      show: true,
    },
    {
      label: 'Find Room',
      icon: <Search size={20} />,
      href: '/find-room',
      show: userRole !== 'owner',
    },
    {
      label: 'List Room',
      icon: <PlusSquare size={20} />,
      href: '/list-room',
      show: true,
    },
    {
      label: 'My Listings',
      icon: <PlusSquare size={20} />,
      href: '/my-listings',
      show: userRole === 'owner',
    },
    {
      label: 'Favorites',
      icon: <Heart size={20} />,
      href: '/favorites',
      show: userRole !== 'owner',
    },
    {
      label: 'Bookings',
      icon: <Calendar size={20} />,
      href: '/bookings',
      show: userRole !== 'owner',
    },
    {
      label: 'Messages',
      icon: <MessageSquare size={20} />,
      href: '/chats',
      show: true,
    },
    {
      label: 'Profile',
      icon: <User size={20} />,
      href: '/profile',
      show: true,
    },
  ];
  
  const filteredNavItems = navItems.filter(item => item.show);

  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  // Render nothing if hideNav is true
  if (hideNav) {
    return <>{children}</>;
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Mobile navigation */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b py-3 px-4">
          <div className="flex justify-between items-center">
            <h1 
              className="text-xl font-bold text-primary cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              Livenzo
            </h1>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px]">
                <SheetHeader>
                  <SheetTitle className="text-left text-primary">Livenzo</SheetTitle>
                </SheetHeader>
                <div className="mt-8 flex flex-col gap-2">
                  {filteredNavItems.map((item) => (
                    <SheetClose key={item.href} asChild>
                      <Button
                        variant={isActive(item.href) ? "secondary" : "ghost"}
                        className={cn(
                          "justify-start gap-2",
                          isActive(item.href) && "bg-primary/10"
                        )}
                        onClick={() => navigate(item.href)}
                      >
                        {item.icon}
                        {item.label}
                      </Button>
                    </SheetClose>
                  ))}
                  <Separator className="my-2" />
                  <Button variant="ghost" className="justify-start gap-2" onClick={handleLogout}>
                    <LogOut size={20} />
                    {isGuestMode ? "Exit Guest Mode" : "Logout"}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>
      )}
      
      {/* Desktop sidebar */}
      {!isMobile && (
        <aside className="fixed top-0 left-0 bottom-0 w-[240px] z-40 bg-white border-r">
          <div className="p-4">
            <h1 
              className="text-xl font-bold text-primary cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              Livenzo
            </h1>
          </div>
          <div className="p-2 mt-2 flex flex-col gap-1">
            {filteredNavItems.map((item) => (
              <Button
                key={item.href}
                variant={isActive(item.href) ? "secondary" : "ghost"}
                className={cn(
                  "justify-start gap-2",
                  isActive(item.href) && "bg-primary/10"
                )}
                onClick={() => navigate(item.href)}
              >
                {item.icon}
                {item.label}
              </Button>
            ))}
            <Separator className="my-2" />
            <Button variant="ghost" className="justify-start gap-2" onClick={handleLogout}>
              <LogOut size={20} />
              {isGuestMode ? "Exit Guest Mode" : "Logout"}
            </Button>
          </div>
        </aside>
      )}
      
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
