
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  badge?: string | null;
  isLoading: boolean;
  isClickable: boolean;
  onClick?: () => void;
  animationDelay: number;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  badge,
  isLoading,
  isClickable,
  onClick,
  animationDelay
}) => {
  return (
    <Card 
      className={cn(
        "border-0 shadow-soft transition-all duration-300 animate-slide-up text-white",
        color,
        isClickable && "cursor-pointer hover:shadow-medium hover:scale-105"
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={isClickable ? onClick : undefined}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20">
            <Icon className="h-6 w-6 text-white" />
          </div>
          {badge && (
            <Badge variant="destructive" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        
        {isLoading ? (
          <div className="space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
            <div className="text-sm opacity-70">Loading...</div>
          </div>
        ) : (
          <div>
            <div className="text-3xl font-display font-bold mb-1 text-white">
              {value}
            </div>
            <div className="text-sm opacity-80">
              {subtitle}
            </div>
            {isClickable && (
              <div className="text-xs mt-2 font-medium text-white/70">
                Click to view
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
