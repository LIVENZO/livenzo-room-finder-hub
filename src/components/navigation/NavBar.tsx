
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetTrigger,
} from '@/components/ui/sheet';
import MobileMenu from './MobileMenu';

const NavBar: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)', paddingBottom: '0.75rem' }}>
      <div className="flex justify-between items-center w-full">
        <h1 
          className="text-xl font-bold text-primary cursor-pointer truncate mr-4"
          onClick={() => navigate('/dashboard')}
        >
          Livenzo
        </h1>
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
