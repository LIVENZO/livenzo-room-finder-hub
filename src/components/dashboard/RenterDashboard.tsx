
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UsersIcon, SearchIcon, Bell, Heart, MessageSquare, MapPin } from 'lucide-react';

const RenterDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  const quickActions = [
    {
      title: 'Find a Room',
      description: 'Discover perfect rooms that match your preferences',
      icon: SearchIcon,
      color: 'bg-gradient-primary',
      iconBg: 'bg-white/20',
      onClick: () => navigate('/find-room'),
      isPrimary: true
    },
    {
      title: 'Find Your Owner',
      description: 'Connect with your property owner',
      icon: UsersIcon,
      color: 'bg-gradient-secondary',
      iconBg: 'bg-white/20',
      onClick: () => navigate('/connections'),
      isPrimary: false
    },
    {
      title: 'View Notices',
      description: 'Check important updates and announcements',
      icon: Bell,
      color: 'bg-gradient-accent',
      iconBg: 'bg-primary-100',
      onClick: () => navigate('/notices'),
      isPrimary: false
    }
  ];

  const quickLinks = [
    { title: 'My Favorites', icon: Heart, path: '/favorites', count: '3' },
    { title: 'Messages', icon: MessageSquare, path: '/chats', count: '2' },
    { title: 'Nearby', icon: MapPin, path: '/find-room', count: '12' }
  ];
  
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="text-center py-8">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 animate-float">
            <SearchIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Welcome to Your Dashboard
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            You're signed in as a <span className="font-semibold text-primary-600">renter</span>. 
            Browse available rooms and connect with property owners to find your perfect home.
          </p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action, index) => (
          <Card 
            key={action.title}
            className={cn(
              "group cursor-pointer border-0 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 animate-slide-up",
              action.color,
              action.isPrimary ? "md:col-span-2" : ""
            )}
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={action.onClick}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", action.iconBg)}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-display font-bold text-white mb-1">
                    {action.title}
                  </CardTitle>
                  <p className="text-white/80 text-sm">{action.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/20 border border-white/30 hover:border-white/50 transition-all w-full md:w-auto"
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <Card className="border-0 shadow-soft bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-display font-bold text-gray-900">
            Quick Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickLinks.map((link, index) => (
              <Button
                key={link.title}
                variant="ghost"
                className="h-auto p-4 flex flex-col items-center gap-3 hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 group animate-scale-in"
                style={{ animationDelay: `${(index + 3) * 100}ms` }}
                onClick={() => navigate(link.path)}
              >
                <div className="w-10 h-10 bg-primary-100 group-hover:bg-primary-200 rounded-xl flex items-center justify-center transition-colors">
                  <link.icon className="h-5 w-5 text-primary-600" />
                </div>
                <div className="text-center">
                  <div className="font-display font-semibold text-sm">{link.title}</div>
                  <div className="text-xs text-gray-500 group-hover:text-primary-600">{link.count} items</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Background decorative elements */}
      <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
        <SearchIcon className="h-64 w-64 text-primary-300" />
      </div>
    </div>
  );
};

export default RenterDashboard;
