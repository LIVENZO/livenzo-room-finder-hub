
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
      <div className="flex justify-center">
        <TabsList className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-soft p-1">
          <TabsTrigger 
            value="dashboard" 
            className="font-display font-medium data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
          >
            Dashboard Overview
          </TabsTrigger>
          <TabsTrigger 
            value="rent"
            className="font-display font-medium data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
          >
            Rent Management
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
      
      <TabsContent value="rent" className="animate-fade-in">
        <RentManagementDashboard />
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
            <SendNoticeForm ownerId={userId} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default OwnerDashboardTabs;
