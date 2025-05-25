
import React from "react";
import { Home, Search, User, Heart, BookMarked, MessageSquare, Users, Plus, List, Bell } from "lucide-react";
import { useAuth } from "@/context/auth";

export type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  ownerOnly?: boolean;
  renterOnly?: boolean;
  visitorOnly?: boolean;
  hideOnMobile?: boolean;
  showNotificationBadge?: boolean;
  label?: string;
};

const useNavItems = (unreadMessageCount: number = 0) => {
  const { user, userRole } = useAuth();
  
  const navItems: NavItem[] = [
    {
      title: "Home",
      href: "/dashboard",
      icon: <Home className="h-4 w-4" />,
      label: "Home",
    },
    {
      title: "Find Room",
      href: "/find-room",
      icon: <Search className="h-4 w-4" />,
      renterOnly: true,
      label: "Find Room",
    },
    {
      title: "List Room",
      href: "/list-room",
      icon: <Plus className="h-4 w-4" />,
      ownerOnly: true,
      label: "List Room",
    },
    {
      title: "My Listings",
      href: "/my-listings",
      icon: <List className="h-4 w-4" />,
      ownerOnly: true,
      label: "My Listings",
    },
    {
      title: userRole === 'owner' ? "Renters" : "Find Your Owner",
      href: "/connections",
      icon: <Users className="h-4 w-4" />,
      label: userRole === 'owner' ? "Renters" : "Find Your Owner",
    },
    {
      title: "Notices",
      href: "/notices",
      icon: <Bell className="h-4 w-4" />,
      renterOnly: true,
      label: "Notices",
    },
    {
      title: "Favorites",
      href: "/favorites",
      icon: <Heart className="h-4 w-4" />,
      renterOnly: true,
      label: "Favorites",
    },
    {
      title: "Bookings",
      href: "/bookings",
      icon: <BookMarked className="h-4 w-4" />,
      label: "Bookings",
    },
    {
      title: "Messages",
      href: "/chats",
      icon: <MessageSquare className="h-4 w-4" />,
      showNotificationBadge: unreadMessageCount > 0,
      label: "Messages",
    },
    {
      title: "Profile",
      href: "/profile",
      icon: <User className="h-4 w-4" />,
      label: "Profile",
    },
  ];

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (!user) return !item.ownerOnly && !item.renterOnly; // For visitors
    if (userRole === 'owner') return !item.renterOnly && !item.visitorOnly;
    return !item.ownerOnly && !item.visitorOnly; // For renters
  });

  return { navItems, filteredNavItems };
};

export { useNavItems };
export default useNavItems;
