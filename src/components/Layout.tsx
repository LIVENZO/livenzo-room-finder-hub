
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Home, 
  LogOut, 
  User, 
  Heart, 
  Calendar, 
  MessageSquare, 
  Bell,
  Menu,
  X 
} from 'lucide-react';
import { Badge } from './ui/badge';
import { useState, useEffect } from 'react';
import { getUnreadMessageCount } from '@/services/ChatService';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

interface LayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, hideNav = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Extract user display name and avatar from user object
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'User';
  const userEmail = user?.email || '';
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '';
  const userInitial = userName.charAt(0).toUpperCase();

  // Check for unread messages periodically
  useEffect(() => {
    if (!user) return;

    const checkUnreadMessages = async () => {
      const count = await getUnreadMessageCount(user.id);
      setUnreadCount(count);
    };

    // Check immediately
    checkUnreadMessages();

    // Then check every minute
    const interval = setInterval(checkUnreadMessages, 60000);

    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const NavLinks = () => (
    <>
      <Link 
        to="/dashboard" 
        className="flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
      >
        <Home className="mr-2 h-4 w-4" />
        <span>Dashboard</span>
      </Link>
      <Link 
        to="/find-room" 
        className="flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
      >
        <span>Find Rooms</span>
      </Link>
      <Link 
        to="/list-room" 
        className="flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
      >
        <span>List Your Room</span>
      </Link>
      <Link 
        to="/favorites" 
        className="flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
      >
        <Heart className="mr-2 h-4 w-4" />
        <span>Favorites</span>
      </Link>
      <Link 
        to="/bookings" 
        className="flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
      >
        <Calendar className="mr-2 h-4 w-4" />
        <span>Bookings</span>
      </Link>
      <Link 
        to="/chats" 
        className="flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        <span>Messages</span>
        {unreadCount > 0 && (
          <Badge className="ml-2 bg-primary">{unreadCount}</Badge>
        )}
      </Link>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {!hideNav && (
        <header className="bg-white border-b py-4 px-4 md:px-6 sticky top-0 z-10">
          <div className="container max-w-7xl mx-auto flex justify-between items-center">
            <div 
              className="flex items-center space-x-2 cursor-pointer" 
              onClick={() => navigate('/dashboard')}
            >
              <div className="bg-primary rounded-full p-2">
                <Home className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-primary">Livenzo</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/find-room" className="text-gray-600 hover:text-primary">Find Rooms</Link>
              <Link to="/list-room" className="text-gray-600 hover:text-primary">List Your Room</Link>
              
              {user && (
                <>
                  <Link to="/favorites" className="text-gray-600 hover:text-primary">
                    <Heart className="h-5 w-5" />
                  </Link>
                  <Link to="/bookings" className="text-gray-600 hover:text-primary">
                    <Calendar className="h-5 w-5" />
                  </Link>
                  <Link to="/chats" className="text-gray-600 hover:text-primary relative">
                    <MessageSquare className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge 
                        className="absolute -top-2 -right-2 h-4 min-w-4 flex items-center justify-center p-0 text-xs"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Link>
                </>
              )}
            </div>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={userAvatar} alt={userName} />
                      <AvatarFallback>{userInitial}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{userName}</p>
                      <p className="text-sm text-muted-foreground">{userEmail}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/favorites')}>
                    <Heart className="h-4 w-4 mr-2" />
                    Favorites
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/bookings')}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Bookings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/chats')}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Messages
                    {unreadCount > 0 && (
                      <Badge className="ml-2">{unreadCount}</Badge>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => navigate('/')}>Sign In</Button>
            )}

            {/* Mobile menu button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="py-4 space-y-4">
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="bg-primary rounded-full p-2">
                      <Home className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-primary">Livenzo</span>
                  </div>
                  
                  {user ? (
                    <div className="flex flex-col space-y-1">
                      <NavLinks />
                      <Link 
                        to="/profile" 
                        className="flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center px-4 py-2 text-red-600 rounded-md hover:bg-gray-100 mt-4 w-full text-left"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </button>
                    </div>
                  ) : (
                    <Button onClick={() => navigate('/')} className="w-full">Sign In</Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>
      )}
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default Layout;
