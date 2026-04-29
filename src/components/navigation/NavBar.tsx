import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetTrigger,
} from '@/components/ui/sheet';
import MobileMenu from './MobileMenu';
import { useAuth } from '@/context/auth';
import PropertySwitcher from '@/components/owner/PropertySwitcher';

const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const isOwner = userRole === 'owner';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 py-3 px-4 safe-area-top">
      <div className="flex justify-between items-center w-full gap-3">
        {isOwner ? (
          <div className="flex-1 min-w-0 mr-2">
            <PropertySwitcher />
          </div>
        ) : (
          <h1
            className="text-xl font-bold text-primary cursor-pointer truncate mr-4"
            onClick={() => navigate('/dashboard')}
          >
            Livenzo
          </h1>
        )}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <Menu size={24} />
            </Button>
          </SheetTrigger>
          <MobileMenu />
        </Sheet>
      </div>
    </header>
  );
};

export default NavBar;
