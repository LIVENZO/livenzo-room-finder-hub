
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, DollarSign } from 'lucide-react';
import SendNoticeForm from '@/components/dashboard/SendNoticeForm';
import StatsGrid from './StatsGrid';
import QuickActionsCard from './QuickActionsCard';
import RentManagementDashboard from '../rent-management/RentManagementDashboard';

interface OwnerDashboardTabsProps {
  listingsCount: number;
  isLoading: boolean;
  pendingConnections: number;
  loadingConnections: boolean;
  onStatsCardClick: (type: 'listings' | 'connections') => void;
  onListRoomClick: () => void;
  onViewListingsClick: () => void;
  onManageConnectionsClick: () => void;
  userId: string;
}

const OwnerDashboardTabs: React.FC<OwnerDashboardTabsProps> = ({
  listingsCount,
  isLoading,
  pendingConnections,
  loadingConnections,
  onStatsCardClick,
  onListRoomClick,
  onViewListingsClick,
  onManageConnectionsClick,
  userId
}) => {
  return (
    <Tabs defaultValue="dashboard" className="space-y-6">
      {/* Mobile-optimized sticky tabs with horizontal scroll */}
      <div className="sticky top-0 z-10 bg-gradient-radial/95 backdrop-blur-sm pb-2">
        <div className="w-full overflow-x-auto scrollbar-hide">
          <div className="flex justify-center min-w-max px-4">
            <TabsList className="bg-white/90 backdrop-blur-sm border border-primary/10 shadow-elegant p-1.5 rounded-xl min-w-max">
              <TabsTrigger 
                value="dashboard" 
                className="font-display font-medium text-sm px-4 py-2.5 min-h-[48px] min-w-[120px] rounded-lg transition-all duration-300 ease-out data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-soft data-[state=active]:scale-[1.02] hover:bg-primary/5 whitespace-nowrap"
              >
                <span className="hidden sm:inline">Dashboard Overview</span>
                <span className="sm:hidden">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger 
                value="rent"
                className="font-display font-medium text-sm px-4 py-2.5 min-h-[48px] min-w-[120px] rounded-lg transition-all duration-300 ease-out data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-soft data-[state=active]:scale-[1.02] hover:bg-primary/5 whitespace-nowrap ml-1"
              >
                <span className="hidden sm:inline">Rent Management</span>
                <span className="sm:hidden">Rent</span>
              </TabsTrigger>
              <TabsTrigger 
                value="notices"
                className="font-display font-medium text-sm px-4 py-2.5 min-h-[48px] min-w-[120px] rounded-lg transition-all duration-300 ease-out data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-soft data-[state=active]:scale-[1.02] hover:bg-primary/5 whitespace-nowrap ml-1"
              >
                <span className="hidden sm:inline">Send Notices</span>
                <span className="sm:hidden">Notices</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
      </div>
      
      {/* Mobile-optimized tab content with proper spacing */}
      <TabsContent value="dashboard" className="space-y-6 px-1 animate-fade-in">
        <StatsGrid
          listingsCount={listingsCount}
          isLoading={isLoading}
          pendingConnections={pendingConnections}
          loadingConnections={loadingConnections}
          onStatsCardClick={onStatsCardClick}
        />

        <QuickActionsCard
          listingsCount={listingsCount}
          onListRoomClick={onListRoomClick}
          onViewListingsClick={onViewListingsClick}
          onManageConnectionsClick={onManageConnectionsClick}
        />
      </TabsContent>
      
      <TabsContent value="rent" className="px-1 animate-fade-in">
        <RentManagementDashboard />
      </TabsContent>
      
      <TabsContent value="notices" className="px-1 animate-fade-in">
        <Card className="border-0 shadow-soft bg-white/90 backdrop-blur-sm rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-display font-bold text-foreground flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Send Notice to Renters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <SendNoticeForm ownerId={userId} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default OwnerDashboardTabs;
