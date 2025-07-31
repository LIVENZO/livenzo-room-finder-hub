import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, MapPin, Plus, CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

interface ActiveRentersListProps {
  renters: RenterPaymentInfo[];
  loading: boolean;
  onAddPayment: (renterId: string, renterName: string) => void;
}

const ActiveRentersList: React.FC<ActiveRentersListProps> = ({
  renters,
  loading,
  onAddPayment
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
          <Badge className="bg-green-100 text-green-800 border-green-200 font-medium">
            ✅ Paid {amount ? `₹${amount.toLocaleString()}` : ''}
          </Badge>
        );
      case 'unpaid':
        return <Badge variant="destructive" className="font-medium">❌ Unpaid</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="font-medium">🕒 Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Renters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 p-4 border rounded-lg">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (renters.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Renters</CardTitle>
          <CardDescription>Manage rent payments for your connected renters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">No active renters found</p>
            <p className="text-sm text-gray-400">
              Connect with renters to start managing rent payments
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Active Renters ({renters.length})
        </CardTitle>
        <CardDescription>Manage rent payments for your connected renters</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {renters.map((renter) => (
            <div
              key={renter.id}
              className="bg-card rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 p-6 mb-4"
            >
              <div className="flex items-start gap-6">
                {/* Left: Avatar */}
                <Avatar className="h-16 w-16 shadow-md flex-shrink-0">
                  <AvatarImage src={renter.renter.avatar_url || ''} />
                  <AvatarFallback className="bg-gradient-primary text-white font-semibold text-lg">
                    {renter.renter.full_name?.charAt(0) || 'R'}
                  </AvatarFallback>
                </Avatar>
                
                {/* Center: Renter Info */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg text-foreground leading-tight">
                      {renter.renter.full_name || 'Unknown Renter'}
                    </h3>
                    
                    {renter.renter.room_number && (
                      <div className="flex items-center gap-2 mt-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Room {renter.renter.room_number}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(renter.paymentStatus)}
                      <span className="text-sm font-medium text-muted-foreground">
                        {renter.paymentStatus === 'paid' && renter.latestPayment 
                          ? `Last payment: ₹${renter.latestPayment.amount.toLocaleString()}`
                          : `Amount due: ₹${renter.amount.toLocaleString()}`
                        }
                      </span>
                    </div>
                    
                    <div>
                      {getStatusBadge(
                        renter.paymentStatus, 
                        renter.paymentStatus === 'paid' ? renter.latestPayment?.amount : undefined
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Right: Add Payment Button */}
                <div className="flex-shrink-0">
                  <Button
                    onClick={() => onAddPayment(renter.renter.id, renter.renter.full_name || 'Unknown')}
                    className="min-h-[56px] min-w-[120px] px-6 rounded-2xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Payment
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveRentersList;