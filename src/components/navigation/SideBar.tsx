import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LogOut, Home, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/context/auth';
import { useNavItems } from '@/hooks/use-nav-items';

const SideBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, userRole } = useAuth();
  const { filteredNavItems } = useNavItems();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  const handleLogout = () => {
    logout();
    navigate('/');
    setShowLogoutDialog(false);
  };
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <aside className="fixed top-0 left-0 bottom-0 w-[280px] z-40 bg-gradient-primary border-r border-sidebar-border/20 shadow-large">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/dashboard')}
          >
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Home className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-white">Livenzo</h1>
              <p className="text-xs text-white/70 capitalize">{userRole} Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4 space-y-2">
          {filteredNavItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-12 text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 font-medium",
                isActive(item.href) && "bg-white/15 text-white shadow-soft border border-white/20"
              )}
              onClick={() => navigate(item.href)}
            >
              <div className={cn(
                "flex items-center justify-center w-5 h-5",
                isActive(item.href) && "text-white"
              )}>
                {item.icon}
              </div>
              <span className="font-display">{item.label || item.title}</span>
              {isActive(item.href) && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
              )}
            </Button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 h-12 text-white/70 hover:text-white hover:bg-red-500/20 transition-all duration-200"
            onClick={() => setShowLogoutDialog(true)}
            data-native-logout
          >
            <LogOut size={20} />
            <span className="font-display font-medium">Logout</span>
          </Button>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-4 right-4 opacity-10">
          <Zap className="h-8 w-8 text-white animate-float" />
        </div>
      </div>
      
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Log out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
};

export default SideBar;
