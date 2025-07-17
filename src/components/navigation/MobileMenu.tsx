
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { useAuth } from '@/context/AuthContext';
import { useNavItems } from '@/hooks/use-nav-items';

const MobileMenu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { filteredNavItems } = useNavItems();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
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
              {item.label || item.title}
            </Button>
          </SheetClose>
        ))}
        <Separator className="my-2" />
        <Button variant="ghost" className="justify-start gap-2" onClick={handleLogout} data-native-logout>
          <LogOut size={20} />
          Logout
        </Button>
      </div>
    </SheetContent>
  );
};

export default MobileMenu;
