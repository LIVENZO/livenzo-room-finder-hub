
import React from 'react';
import {
  Home,
  Search,
  PlusSquare,
  Heart,
  Calendar,
  MessageSquare,
  User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const useNavItems = () => {
  const { userRole } = useAuth();
  
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

  return { navItems, filteredNavItems };
};
