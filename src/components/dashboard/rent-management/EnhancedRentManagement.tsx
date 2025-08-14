import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  IndianRupee, 
  Calendar, 
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RentStats {
  totalReceived: number;
  thisMonth: number;
  pendingAmount: number;
  activeRenters: number;
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
  relationshipId?: string;
}

const EnhancedRentManagement: React.FC = () => {
  const { user } = useAuth();
  
  const [stats, setStats] = useState<RentStats>({
    totalReceived: 0,
    thisMonth: 0,
    pendingAmount: 0,
    activeRenters: 0
  });
  
  const [renters, setRenters] = useState<RenterPaymentInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchRenters(), fetchStats()]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load rent management data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRenters = async () => {
    if (!user?.id) return;
    
    try {
      // Get relationships
      const { data: relationships, error: relationshipsError } = await supabase
        .from('relationships')
        .select('id, renter_id, status')
        .eq('owner_id', user.id)
        .eq('status', 'accepted')
        .eq('archived', false);

      if (relationshipsError) throw relationshipsError;

      if (!relationships || relationships.length === 0) {
        setRenters([]);
        return;
      }

      // Get renter profiles
      const { data: renterProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url, room_number')
        .in('id', relationships.map(r => r.renter_id));

      if (profilesError) throw profilesError;

      // Get rent statuses for these relationships
      const { data: rentStatuses, error: rentError } = await supabase
        .from('rent_status')
        .select('*')
        .in('relationship_id', relationships.map(r => r.id));

      if (rentError) throw rentError;

      // Get latest payments
      const { data: latestPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .in('renter_id', relationships.map(r => r.renter_id))
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Combine data
      const renterPaymentInfo: RenterPaymentInfo[] = relationships.map(relationship => {
        const renterProfile = renterProfiles?.find(p => p.id === relationship.renter_id);
        const rentStatus = rentStatuses?.find(r => r.relationship_id === relationship.id);
        const renterPayments = latestPayments?.filter(p => p.renter_id === relationship.renter_id) || [];
        const latestPayment = renterPayments[0];

        return {
          id: relationship.id,
          renter: {
            id: relationship.renter_id,
            full_name: renterProfile?.full_name || 'Unknown Renter',
            avatar_url: renterProfile?.avatar_url || '',
            room_number: renterProfile?.room_number || ''
          },
          relationshipId: relationship.id,
          paymentStatus: rentStatus?.status === 'paid' ? 'paid' : 'unpaid',
          amount: rentStatus?.current_amount || 0,
          dueDate: rentStatus?.due_date,
          lastPaymentDate: latestPayment?.payment_date
        };
      });

      setRenters(renterPaymentInfo);
    } catch (error) {
      console.error('Error fetching renters:', error);
      throw error;
    }
  };

  const fetchStats = async () => {
    if (!user?.id) return;
    
    try {
      // Get payment stats
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          amount,
          payment_date,
          status,
          relationships!inner(owner_id)
        `)
        .eq('relationships.owner_id', user.id);

      if (paymentsError) throw paymentsError;

      // Get rent statuses for pending amounts
      const { data: rentStatuses, error: rentError } = await supabase
        .from('rent_status')
        .select(`
          current_amount,
          status,
          relationships!inner(owner_id)
        `)
        .eq('relationships.owner_id', user.id)
        .neq('status', 'paid');

      if (rentError) throw rentError;

      // Calculate stats
      const totalReceived = payments
        ?.filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonth = payments
        ?.filter(p => {
          const paymentDate = new Date(p.payment_date);
          return p.status === 'paid' && 
                 paymentDate.getMonth() === currentMonth && 
                 paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const pendingAmount = rentStatuses
        ?.reduce((sum, r) => sum + Number(r.current_amount), 0) || 0;

      setStats({
        totalReceived,
        thisMonth,
        pendingAmount,
        activeRenters: renters.length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Unpaid</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <IndianRupee className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700">Total Received</p>
                <p className="text-2xl font-bold text-green-800">
                  ₹{stats.totalReceived.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700">This Month</p>
                <p className="text-2xl font-bold text-blue-800">
                  ₹{stats.thisMonth.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-700">Pending Amount</p>
                <p className="text-2xl font-bold text-orange-800">
                  ₹{stats.pendingAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-700">Active Renters</p>
                <p className="text-2xl font-bold text-purple-800">
                  {stats.activeRenters}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Renters List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Rent Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renters.length === 0 ? (
            <div className="text-center py-8">
              <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No active renters found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {renters.map((renter) => (
                <div
                  key={renter.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-colors",
                    renter.paymentStatus === 'paid' 
                      ? "bg-green-50 border-green-200" 
                      : "bg-red-50 border-red-200"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={renter.renter.avatar_url} />
                      <AvatarFallback>
                        {renter.renter.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{renter.renter.full_name}</p>
                        {getStatusIcon(renter.paymentStatus)}
                      </div>
                      {renter.renter.room_number && (
                        <p className="text-sm text-muted-foreground">
                          Room: {renter.renter.room_number}
                        </p>
                      )}
                      {renter.lastPaymentDate && (
                        <p className="text-xs text-muted-foreground">
                          Last payment: {new Date(renter.lastPaymentDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">₹{renter.amount.toLocaleString()}</p>
                        {renter.dueDate && (
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(renter.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(renter.paymentStatus)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedRentManagement;