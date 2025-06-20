
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, List, UsersIcon, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  isPrimary: boolean;
  show: boolean;
}

interface QuickActionsCardProps {
  listingsCount: number;
  onListRoomClick: () => void;
  onViewListingsClick: () => void;
  onManageConnectionsClick: () => void;
}

const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  listingsCount,
  onListRoomClick,
  onViewListingsClick,
  onManageConnectionsClick
}) => {
  const quickActions: QuickAction[] = [
    {
      title: 'List New Room',
      description: 'Add a new property to attract renters',
      icon: Plus,
      onClick: onListRoomClick,
      isPrimary: true,
      show: true
    },
    {
      title: 'View All Listings',
      description: 'Manage your existing properties',
      icon: List,
      onClick: onViewListingsClick,
      isPrimary: false,
      show: listingsCount > 0
    },
    {
      title: 'Manage Renters',
      description: 'Review connection requests and communications',
      icon: UsersIcon,
      onClick: onManageConnectionsClick,
      isPrimary: false,
      show: true
    }
  ];

  return (
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
              style={{ animationDelay: `${(index + 2) * 100}ms` }}
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
  );
};

export default QuickActionsCard;
