
import React from "react";
import { Home, Search, PlusCircle, User, Heart, BookMarked, MessageSquare, List, Users } from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  ownerOnly?: boolean;
  renterOnly?: boolean;
  visitorOnly?: boolean;
  hideOnMobile?: boolean;
  showNotificationBadge?: boolean;
};

const useNavItems = (unreadMessageCount: number = 0) => {
  const navItems: NavItem[] = [
    {
      title: "Home",
      href: "/dashboard",
      icon: <Home className="h-4 w-4" />,
    },
    {
      title: "Find Room",
      href: "/find-room",
      icon: <Search className="h-4 w-4" />,
      renterOnly: true,
    },
    {
      title: "List Room",
      href: "/list-room",
      icon: <PlusCircle className="h-4 w-4" />,
      ownerOnly: true,
      hideOnMobile: true,
    },
    {
      title: "My Listings",
      href: "/my-listings",
      icon: <List className="h-4 w-4" />,
      ownerOnly: true,
    },
    {
      title: "Connections",
      href: "/connections",
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: "Favorites",
      href: "/favorites",
      icon: <Heart className="h-4 w-4" />,
      renterOnly: true,
    },
    {
      title: "Bookings",
      href: "/bookings",
      icon: <BookMarked className="h-4 w-4" />,
    },
    {
      title: "Messages",
      href: "/chats",
      icon: <MessageSquare className="h-4 w-4" />,
      showNotificationBadge: unreadMessageCount > 0,
    },
    {
      title: "Profile",
      href: "/profile",
      icon: <User className="h-4 w-4" />,
    },
  ];

  return navItems;
};

export default useNavItems;
