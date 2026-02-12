import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UsersIcon, SearchIcon, Bell, Heart, MessageSquare, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import BookingStatusCard from './BookingStatusCard';

const heroImages = [
  'https://naoqigivttgpkfwpzcgg.supabase.co/storage/v1/object/public/rooms/267fcf84-88d8-4ca9-b414-9976f3981a50/1766131737442_0ozzpm685nw.jpg',
  'https://naoqigivttgpkfwpzcgg.supabase.co/storage/v1/object/public/rooms/267fcf84-88d8-4ca9-b414-9976f3981a50/1766131738562_bd30txo9bd.jpg',
  'https://naoqigivttgpkfwpzcgg.supabase.co/storage/v1/object/public/rooms/267fcf84-88d8-4ca9-b414-9976f3981a50/1767528319032_j7mjrqzq9ol.jpg',
  'https://naoqigivttgpkfwpzcgg.supabase.co/storage/v1/object/public/rooms/267fcf84-88d8-4ca9-b414-9976f3981a50/1766132019346_v39iyaqqgs.jpg',
  'https://naoqigivttgpkfwpzcgg.supabase.co/storage/v1/object/public/rooms/267fcf84-88d8-4ca9-b414-9976f3981a50/1767873415838_ncg44uvhnsj.jpg',
];

const RenterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  }, []);

  // Auto-slide every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(nextSlide, 3500);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
    setTouchStart(null);
  };

  const quickActions = [{
    title: 'Find a Room',
    description: 'Discover perfect rooms that match your preferences',
    icon: SearchIcon,
    color: 'bg-gradient-primary',
    iconBg: 'bg-white/20',
    onClick: () => navigate('/find-room'),
    isPrimary: true
  }, {
    title: 'Find Your Owner',
    description: 'Connect with your property owner',
    icon: UsersIcon,
    color: 'bg-gradient-secondary',
    iconBg: 'bg-white/20',
    onClick: () => navigate('/connections'),
    isPrimary: false
  }, {
    title: 'View Notices',
    description: 'Check important updates and announcements',
    icon: Bell,
    color: 'bg-gradient-to-br from-[#BFA5FF] to-[#D3C5FF]',
    iconBg: 'bg-white/30',
    textColor: 'text-purple-900',
    buttonStyle: 'bg-purple-800 hover:bg-purple-900 text-white border-0',
    onClick: () => navigate('/notices'),
    isPrimary: false,
    hasNotification: true
  }];
  const quickLinks = [{
    title: 'My Favorites',
    icon: Heart,
    path: '/favorites',
    count: '3'
  }, {
    title: 'Messages',
    icon: MessageSquare,
    path: '/anonymous-chat',
    count: '2'
  }, {
    title: 'Nearby',
    icon: MapPin,
    path: '/find-room',
    count: '12'
  }];
  return <div className="space-y-8 animate-fade-in">
      {/* Booking Status Card */}
      <BookingStatusCard />

      {/* Hero Carousel Section */}
      <div 
        className="relative h-48 sm:h-56 rounded-2xl overflow-hidden shadow-medium"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Carousel Images */}
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              index === currentSlide ? "opacity-100" : "opacity-0"
            )}
          >
            <img
              src={image}
              alt={`Room ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Search Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl shadow-lg animate-float cursor-pointer hover:scale-105 transition-transform"
               onClick={() => navigate('/find-room')}>
            <SearchIcon className="h-8 w-8 text-white" />
          </div>
        </div>
        
        {/* Slide Indicators */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentSlide 
                  ? "bg-white w-4" 
                  : "bg-white/50 hover:bg-white/70"
              )}
            />
          ))}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {quickActions.map((action, index) => <Card key={action.title} className={cn("group cursor-pointer border-0 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 animate-slide-up", action.color, action.isPrimary ? "sm:col-span-2 lg:col-span-2" : "")} style={{
        animationDelay: `${index * 100}ms`
      }} onClick={action.onClick}>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center relative", action.iconBg)}>
                  <action.icon className={cn("h-6 w-6", action.textColor ? "text-purple-800" : "text-white", action.hasNotification ? "animate-pulse" : "")} />
                  {action.hasNotification && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>}
                </div>
                <div className="flex-1">
                  <CardTitle className={cn("text-xl font-display font-bold mb-1", action.textColor || "text-white")}>
                    {action.title}
                  </CardTitle>
                  <p className={cn("text-sm", action.textColor ? "text-purple-700" : "text-white/80")}>
                    {action.description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button variant="ghost" className={cn("transition-all w-full", action.buttonStyle || "text-white hover:bg-white/20 border border-white/30 hover:border-white/50")}>
                <span className="hidden sm:inline">Get Started</span>
                <span className="sm:hidden">Start</span>
              </Button>
            </CardContent>
          </Card>)}
      </div>

      {/* Quick Links */}
      <Card className="border-0 shadow-soft bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-display font-bold text-gray-900">
            Quick Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {quickLinks.map((link, index) => <Button key={link.title} variant="ghost" className="h-auto p-3 sm:p-4 flex flex-col items-center gap-2 sm:gap-3 hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 group animate-scale-in" style={{
            animationDelay: `${(index + 3) * 100}ms`
          }} onClick={() => navigate(link.path)}>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 group-hover:bg-primary-200 rounded-xl flex items-center justify-center transition-colors">
                  <link.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
                </div>
                <div className="text-center">
                  <div className="font-display font-semibold text-xs sm:text-sm truncate w-full">{link.title}</div>
                  <div className="text-xs text-gray-500 group-hover:text-primary-600">{link.count}</div>
                </div>
              </Button>)}
          </div>
        </CardContent>
      </Card>

      {/* Background decorative elements */}
      <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
        <SearchIcon className="h-64 w-64 text-primary-300" />
      </div>
    </div>;
};
export default RenterDashboard;