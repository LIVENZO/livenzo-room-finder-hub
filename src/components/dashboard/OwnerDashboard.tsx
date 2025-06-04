
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, List, Loader2, UsersIcon, Bell, Home, TrendingUp, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { fetchOwnerRelationships } from '@/services/relationship';
import { Badge } from '@/components/ui/badge';
import SendNoticeForm from '@/components/dashboard/SendNoticeForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';

const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requireOwnerComplete } = useProfileCompletion();
  
  const [listingsCount, setListingsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingConnections, setPendingConnections] = useState(0);
  const [loadingConnections, setLoadingConnections] = useState(true);
  
  useEffect(() => {
    if (!user) return;
    
    const fetchListingsCount = async () => {
      try {
        const { count, error } = await supabase
          .from('rooms')
          .select('id', { count: 'exact' })
          .eq('owner_id', user.id);
          
        if (error) {
          console.error('Error fetching listings count:', error);
          return;
        }
        
        setListingsCount(count || 0);
      } catch (error) {
        console.error('Error in fetchListingsCount:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchConnectionRequests = async () => {
      setLoadingConnections(true);
      try {
        const relationships = await fetchOwnerRelationships(user.id);
        const pending = relationships.filter(r => r.status === 'pending').length;
        setPendingConnections(pending);
        console.log(`Found ${pending} pending connection requests`);
      } catch (error) {
        console.error('Error fetching connection requests:', error);
      } finally {
        setLoadingConnections(false);
      }
    };
    
    fetchListingsCount();
    fetchConnectionRequests();
  }, [user]);

  const handleListRoomClick = () => {
    requireOwnerComplete(() => navigate('/list-room'));
  };

  const handleViewListingsClick = () => {
    requireOwnerComplete(() => navigate('/my-listings'));
  };

  const handleManageConnectionsClick = () => {
    requireOwnerComplete(() => navigate('/connections'));
  };

  const statsCards = [
    {
      title: 'Active Listings',
      value: listingsCount,
      subtitle: listingsCount === 0 ? "No rooms listed yet" : `${listingsCount} room${listingsCount === 1 ? '' : 's'} available`,
      icon: Home,
      color: 'bg-gradient-primary',
      isLoading: isLoading
    },
    {
      title: 'Connection Requests',
      value: pendingConnections,
      subtitle: pendingConnections === 0 ? "No pending requests" : `${pendingConnections} awaiting response`,
      icon: UsersIcon,
      color: 'bg-gradient-secondary',
      badge: pendingConnections > 0 ? 'New' : null,
      isLoading: loadingConnections
    },
    {
      title: 'Profile Views',
      value: '24',
      subtitle: 'This month',
      icon: Eye,
      color: 'bg-accent-100 border border-accent-200',
      textColor: 'text-accent-800',
      isLoading: false
    },
    {
      title: 'Growth',
      value: '+12%',
      subtitle: 'vs last month',
      icon: TrendingUp,
      color: 'bg-success/10 border border-success/20',
      textColor: 'text-success',
      isLoading: false
    }
  ];

  const quickActions = [
    {
      title: 'List New Room',
      description: 'Add a new property to attract renters',
      icon: Plus,
      onClick: handleListRoomClick,
      isPrimary: true,
      show: true
    },
    {
      title: 'View All Listings',
      description: 'Manage your existing properties',
      icon: List,
      onClick: handleViewListingsClick,
      isPrimary: false,
      show: listingsCount > 0
    },
    {
      title: 'Manage Renters',
      description: 'Review connection requests and communications',
      icon: UsersIcon,
      onClick: handleManageConnectionsClick,
      isPrimary: false,
      show: true
    }
  ];
  
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="text-center py-8">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 animate-float">
            <Home className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Property Owner Dashboard
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage your properties, connect with renters, and grow your rental business with ease.
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="dashboard" className="space-y-6">
        <div className="flex justify-center">
          <TabsList className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-soft p-1">
            <TabsTrigger 
              value="dashboard" 
              className="font-display font-medium data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
            >
              Dashboard Overview
            </TabsTrigger>
            <TabsTrigger 
              value="notices"
              className="font-display font-medium data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
            >
              Send Notices
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="dashboard" className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((stat, index) => (
              <Card 
                key={stat.title}
                className={cn(
                  "border-0 shadow-soft hover:shadow-medium transition-all duration-300 animate-slide-up",
                  stat.color,
                  !stat.textColor && "text-white"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      stat.textColor ? "bg-white/10" : "bg-white/20"
                    )}>
                      <stat.icon className={cn("h-6 w-6", stat.textColor || "text-white")} />
                    </div>
                    {stat.badge && (
                      <Badge variant="destructive" className="text-xs">
                        {stat.badge}
                      </Badge>
                    )}
                  </div>
                  
                  {stat.isLoading ? (
                    <div className="space-y-2">
                      <Loader2 className={cn("h-6 w-6 animate-spin", stat.textColor || "text-white")} />
                      <div className="text-sm opacity-70">Loading...</div>
                    </div>
                  ) : (
                    <div>
                      <div className={cn("text-3xl font-display font-bold mb-1", stat.textColor || "text-white")}>
                        {stat.value}
                      </div>
                      <div className={cn("text-sm opacity-80", stat.textColor ? "opacity-60" : "")}>
                        {stat.subtitle}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card className="border-0 shadow-soft bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-display font-bold text-gray-900">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickActions.filter(action => action.show).map((action, index) => (
                  <Button
                    key={action.title}
                    variant={action.isPrimary ? "default" : "outline"}
                    className={cn(
                      "h-auto p-6 flex flex-col items-center gap-4 transition-all duration-200 animate-scale-in",
                      action.isPrimary 
                        ? "bg-gradient-primary hover:shadow-medium text-white border-0" 
                        : "hover:bg-primary-50 hover:border-primary-200"
                    )}
                    style={{ animationDelay: `${(index + 4) * 100}ms` }}
                    onClick={action.onClick}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      action.isPrimary ? "bg-white/20" : "bg-primary-100"
                    )}>
                      <action.icon className={cn(
                        "h-6 w-6",
                        action.isPrimary ? "text-white" : "text-primary-600"
                      )} />
                    </div>
                    <div className="text-center">
                      <div className="font-display font-semibold mb-1">{action.title}</div>
                      <div className={cn(
                        "text-xs",
                        action.isPrimary ? "text-white/80" : "text-gray-600"
                      )}>
                        {action.description}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notices" className="animate-fade-in">
          <Card className="border-0 shadow-soft bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-display font-bold text-gray-900 flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary-600" />
                Send Notice to Renters
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user && <SendNoticeForm ownerId={user.id} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Background decorative elements */}
      <div className="fixed top-1/3 right-1/4 opacity-5 pointer-events-none">
        <Home className="h-48 w-48 text-primary-300 animate-float" />
      </div>
    </div>
  );
};

export default OwnerDashboard;
