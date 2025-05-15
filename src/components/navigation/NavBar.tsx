
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
          <MobileMenu />
        </Sheet>
      </div>
    </header>
  );
};

export default NavBar;
