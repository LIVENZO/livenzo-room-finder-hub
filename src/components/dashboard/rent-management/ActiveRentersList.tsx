import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, MapPin, Plus, CheckCircle, XCircle, Clock, Users, Camera, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SwipeableRenterCard from './SwipeableRenterCard';
import SwipeTutorial from './SwipeTutorial';

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
  onRefresh?: () => void;
}

const ActiveRentersList: React.FC<ActiveRentersListProps> = ({
  renters,
  loading,
  onAddPayment,
  meterPhotos = {},
  onRefresh
}) => {
  const [showTutorial, setShowTutorial] = useState(false);

  // Check if tutorial should be shown (first time user)
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('swipe_tutorial_completed');
    if (!hasSeenTutorial && renters.length > 0) {
      setShowTutorial(true);
    }
  }, [renters.length]);

  const handleTutorialComplete = () => {
    localStorage.setItem('swipe_tutorial_completed', 'true');
    setShowTutorial(false);
  };

  const handleTutorialSkip = () => {
    localStorage.setItem('swipe_tutorial_completed', 'true');
    setShowTutorial(false);
  };

  const handleSwipeAction = async (renterId: string, action: 'paid' | 'unpaid', renterInfo: RenterPaymentInfo) => {
    try {
      console.log('🔄 Updating payment status:', { renterId, action, renterInfo });
      
      // Get current user
      const { data: currentUser } = await supabase.auth.getUser();
      const ownerId = currentUser?.user?.id;

      if (!ownerId) {
        throw new Error('User not authenticated');
      }

      // 1. Update rent_status table
      const { error: rentStatusError } = await supabase
        .from('rent_status')
        .upsert({ 
          relationship_id: renterId,
          status: action,
          current_amount: renterInfo.amount,
          due_date: renterInfo.dueDate || new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        });

      if (rentStatusError) {
        throw rentStatusError;
      }

      // 2. If marking as paid, create a payment record
      if (action === 'paid') {
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            renter_id: renterInfo.renter.id,
            owner_id: ownerId,
            relationship_id: renterId,
            amount: renterInfo.amount,
            status: 'paid',
            payment_method: 'manual_update',
            payment_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (paymentError) {
          throw paymentError;
        }
      }

      // 3. Send notification if marking as unpaid
      if (action === 'unpaid') {
        try {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              type: 'payment_reminder',
              record: {
                renter_id: renterInfo.renter.id,
                owner_id: (await supabase.auth.getUser()).data.user?.id,
                relationship_id: renterId,
                amount: renterInfo.amount,
                renter_name: renterInfo.renter.full_name,
                title: 'Payment Reminder',
                message: '⚠️ Your rent is pending. Please complete your payment.',
                deep_link_url: 'https://livenzo-room-finder-hub.lovable.app/payments'
              }
            }
          });
          console.log('📧 Notification sent to renter');
        } catch (notifError) {
          console.warn('⚠️ Failed to send notification:', notifError);
          // Don't fail the whole operation for notification failure
        }
      }

      // Update local state immediately for smooth UX
      const updatedRenters = renters.map(r => 
        r.id === renterId 
          ? { ...r, paymentStatus: action as 'paid' | 'unpaid' | 'pending' }
          : r
      );
      
      // Show success animation/toast
      toast.success(
        <div className="flex items-center gap-2">
          {action === 'paid' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <span>Renter marked as {action}</span>
        </div>, 
        {
          description: action === 'unpaid' 
            ? 'Payment reminder sent to renter' 
            : 'Payment status updated successfully',
          duration: 3000
        }
      );

      // Refresh data after a short delay to show the updated state
      setTimeout(() => {
        if (onRefresh) {
          onRefresh();
        }
      }, 1000);

    } catch (error) {
      console.error('❌ Error updating payment status:', error);
      toast.error('Failed to update payment status', {
        description: 'Please try again or contact support',
        duration: 5000
      });
    }
  };
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
    <>
      <div className="bg-background">
        {renters.map((renter, index) => (
          <SwipeableRenterCard
            key={renter.id}
            renter={renter}
            index={index}
            onSwipeAction={(renterId, action) => handleSwipeAction(renterId, action, renter)}
            meterPhotos={meterPhotos}
            onAddPayment={onAddPayment}
          />
        ))}
      </div>

      {/* Tutorial Modal */}
      <SwipeTutorial
        isVisible={showTutorial}
        onComplete={handleTutorialComplete}
        onSkip={handleTutorialSkip}
      />
    </>
  );
};

export default ActiveRentersList;