
import React from 'react';
import { Home, UsersIcon } from 'lucide-react';
import StatsCard from './StatsCard';

interface StatsGridProps {
  listingsCount: number;
  isLoading: boolean;
  pendingConnections: number;
  loadingConnections: boolean;
  onStatsCardClick: (type: 'listings' | 'connections') => void;
}

const StatsGrid: React.FC<StatsGridProps> = ({
  listingsCount,
  isLoading,
  pendingConnections,
  loadingConnections,
  onStatsCardClick
}) => {
  const statsCards = [
    {
      title: 'Active Listings',
      value: listingsCount,
      subtitle: listingsCount === 0 ? "No rooms listed yet" : `${listingsCount} room${listingsCount === 1 ? '' : 's'} available`,
      icon: Home,
      color: 'bg-gradient-primary',
      isLoading: isLoading,
      isClickable: true,
      onClick: () => onStatsCardClick('listings')
    },
    {
      title: 'Connection Requests',
      value: pendingConnections,
      subtitle: pendingConnections === 0 ? "No pending requests" : `${pendingConnections} awaiting response`,
      icon: UsersIcon,
      color: 'bg-gradient-secondary',
      badge: pendingConnections > 0 ? 'New' : null,
      isLoading: loadingConnections,
      isClickable: true,
      onClick: () => onStatsCardClick('connections')
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {statsCards.map((stat, index) => (
        <StatsCard
          key={stat.title}
          {...stat}
          animationDelay={index * 100}
        />
      ))}
    </div>
  );
};

export default StatsGrid;
