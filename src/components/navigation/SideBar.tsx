
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { useNavItems } from '@/hooks/use-nav-items';

const SideBar: React.FC = () => {
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
          Logout
        </Button>
      </div>
    </aside>
  );
};

export default SideBar;
