import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, MapPin, Plus, CheckCircle, XCircle, Clock, Users, Camera, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MeterPhoto {
  id: string;
  relationship_id: string;
  renter_id: string;
  owner_id: string;
  photo_url: string;
  photo_name: string;
  file_size: number;
  billing_month: string;
  created_at: string;
  updated_at: string;
}

interface RenterPaymentInfo {
  id: string;
  renter: {
    id: string;
    full_name: string;
    avatar_url?: string;
    room_number?: string;
  };
  paymentStatus: 'paid' | 'unpaid' | 'pending';
  amount: number;
  dueDate?: string;
  lastPaymentDate?: string;
  latestPayment?: {
    amount: number;
    payment_date: string;
    status: string;
  };
  relationshipId?: string;
  meterPhotos?: MeterPhoto[];
}

interface ActiveRentersListProps {
  renters: RenterPaymentInfo[];
  loading: boolean;
  onAddPayment: (renterId: string, renterName: string) => void;
  meterPhotos?: Record<string, MeterPhoto[]>;
}

const ActiveRentersList: React.FC<ActiveRentersListProps> = ({
  renters,
  loading,
  onAddPayment,
  meterPhotos = {}
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'unpaid':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string, amount?: number) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 font-medium text-xs">
            Paid
          </Badge>
        );
      case 'unpaid':
        return <Badge variant="destructive" className="font-medium text-xs">Unpaid</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="font-medium text-xs">Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="px-4">
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-4 p-6 bg-card border-b border-border/50">
              <div className="h-14 w-14 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
              <div className="h-11 w-28 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (renters.length === 0) {
    return (
      <div className="px-4 py-16 text-center">
        <div className="mx-auto w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-6">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No active renters found</h3>
        <p className="text-muted-foreground">
          Connect with renters to start managing rent payments
        </p>
      </div>
    );
  }

  return (
    <div className="bg-background">
      {renters.map((renter, index) => (
        <div
          key={renter.id}
          className={`bg-card border-b border-border/50 px-4 py-6 hover:bg-muted/30 transition-colors active:bg-muted/50 ${
            index === 0 ? 'border-t border-border/50' : ''
          }`}
        >
          <div className="flex items-center gap-4">
            {/* Left: Avatar */}
            <Avatar className="h-14 w-14 ring-2 ring-border/20 flex-shrink-0">
              <AvatarImage src={renter.renter.avatar_url || ''} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-base">
                {renter.renter.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'R'}
              </AvatarFallback>
            </Avatar>
            
            {/* Center: Renter Info */}
            <div className="flex-1 min-w-0 space-y-1">
              <h3 className="font-bold text-base text-foreground leading-tight">
                {renter.renter.full_name || 'Unknown Renter'}
              </h3>
              
              {renter.renter.room_number && (
                <p className="text-sm font-medium text-muted-foreground">
                  Room {renter.renter.room_number}
                </p>
              )}
              
              <div className="flex items-center gap-2 pt-1">
                <span className="text-sm font-semibold text-foreground">
                  ₦{renter.amount.toLocaleString()}
                </span>
                {getStatusBadge(renter.paymentStatus)}
              </div>

              {/* Meter Photos Display */}
              {renter.relationshipId && meterPhotos[renter.relationshipId] && meterPhotos[renter.relationshipId].length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center gap-1 text-xs text-green-600 font-medium mb-1">
                    <Camera className="h-3 w-3" />
                    Meter Photo Uploaded
                  </div>
                  <div className="flex gap-2">
                    {meterPhotos[renter.relationshipId].slice(0, 2).map((photo) => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.photo_url}
                          alt="Meter reading"
                          className="w-12 h-12 object-cover rounded border cursor-pointer"
                          onClick={() => window.open(photo.photo_url, '_blank')}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                          <Download className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    ))}
                    {meterPhotos[renter.relationshipId].length > 2 && (
                      <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center text-xs font-medium text-muted-foreground">
                        +{meterPhotos[renter.relationshipId].length - 2}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Right: Add Payment Button */}
            <div className="flex-shrink-0">
              <Button
                onClick={() => onAddPayment(renter.renter.id, renter.renter.full_name || 'Unknown')}
                className="min-h-[48px] px-6 font-semibold transition-all duration-200"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Payment
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActiveRentersList;