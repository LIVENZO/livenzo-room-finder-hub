import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Calendar, AlertCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RentSummaryCardsProps {
  stats: {
    totalReceived: number;
    thisMonth: number;
    pendingAmount: number;
    activeRenters: number;
  };
  loading: boolean;
  onCardClick: (type: 'total' | 'month' | 'pending' | 'renters') => void;
}

const RentSummaryCards: React.FC<RentSummaryCardsProps> = ({
  stats,
  loading,
  onCardClick
}) => {
  const cards = [
    {
      type: 'total' as const,
      title: 'Total Received',
      value: stats.totalReceived,
      icon: DollarSign,
      gradient: 'from-green-400 to-green-600',
      bgGradient: 'from-green-50 to-green-100',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconBg: 'bg-green-500',
      subtitle: 'All time'
    },
    {
      type: 'month' as const,
      title: 'This Month',
      value: stats.thisMonth,
      icon: Calendar,
      gradient: 'from-blue-400 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconBg: 'bg-blue-500',
      subtitle: 'Current month'
    },
    {
      type: 'pending' as const,
      title: 'Pending',
      value: stats.pendingAmount,
      icon: AlertCircle,
      gradient: 'from-orange-400 to-orange-600',
      bgGradient: 'from-orange-50 to-orange-100',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-800',
      iconBg: 'bg-orange-500',
      subtitle: 'Unpaid rent'
    },
    {
      type: 'renters' as const,
      title: 'Active Renters',
      value: stats.activeRenters,
      icon: Users,
      gradient: 'from-purple-400 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-800',
      iconBg: 'bg-purple-500',
      subtitle: 'Connected',
      isCount: true
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <Card
          key={card.type}
          className={cn(
            "cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-105",
            "bg-gradient-to-br shadow-soft border-0",
            card.bgGradient
          )}
          onClick={() => onCardClick(card.type)}
        >
          <CardContent className="p-4 h-full">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg shadow-sm",
                    card.iconBg
                  )}>
                    <card.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {card.title}
                    </p>
                    <p className={cn(
                      "text-lg sm:text-xl font-bold truncate",
                      card.textColor
                    )}>
                      {card.isCount 
                        ? card.value 
                        : `₹${card.value.toLocaleString()}`
                      }
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {card.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RentSummaryCards;