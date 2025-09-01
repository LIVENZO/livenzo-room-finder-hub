import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { toast } from "sonner";
import { RentPaymentCard } from "@/components/payments/RentPaymentCard";
import { PaymentHistoryList } from "@/components/payments/PaymentHistoryList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Relationship {
  id: string;
  owner_id: string;
  status: string;
}

interface RentStatus {
  id: string;
  relationship_id: string;
  current_amount: number;
  due_date: string;
  status: string;
}

interface OwnerInfo {
  full_name: string;
  property_name?: string;
}

export const PayRentSection = () => {
  const [activeRelationship, setActiveRelationship] = useState<Relationship | null>(null);
  const [rentStatus, setRentStatus] = useState<RentStatus | null>(null);
  const [ownerInfo, setOwnerInfo] = useState<OwnerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchActiveRelationship();
    }
  }, [user]);

  const fetchActiveRelationship = async () => {
    try {
      setIsLoading(true);
      
      // Fetch relationship with owner profile data
      const { data: relationship, error: relationshipError } = await supabase
        .from('relationships')
        .select(`
          *,
          user_profiles!relationships_owner_id_fkey(full_name, property_name)
        `)
        .eq('renter_id', user.id)
        .eq('status', 'accepted')
        .eq('archived', false)
        .maybeSingle();

      if (relationshipError) {
        console.error('Error fetching relationship:', relationshipError);
        toast.error('Failed to load rental information');
        return;
      }

      if (!relationship) {
        setActiveRelationship(null);
        setRentStatus(null);
        setOwnerInfo(null);
        return;
      }

      setActiveRelationship(relationship);
      
      // Set owner info
      const owner = Array.isArray(relationship.user_profiles) 
        ? relationship.user_profiles[0] 
        : relationship.user_profiles;
      setOwnerInfo(owner || { full_name: 'Property Owner' });

      // Fetch rent status for this relationship
      const { data: rentStatusData, error: rentError } = await supabase
        .from('rent_status')
        .select('*')
        .eq('relationship_id', relationship.id)
        .maybeSingle();

      if (rentError && rentError.code !== 'PGRST116') {
        console.error('Error fetching rent status:', rentError);
        toast.error('Failed to load rent details');
        return;
      }

      setRentStatus(rentStatusData);
    } catch (error) {
      console.error('Error fetching relationship:', error);
      toast.error('Failed to load rental information');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activeRelationship) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <h3 className="text-lg font-semibold mb-2">No Active Rental</h3>
          <p className="text-muted-foreground text-center">
            You don't have any active rental agreements. Connect with an owner to start paying rent.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pay-rent" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pay-rent">Pay Rent</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pay-rent" className="space-y-4">
          {rentStatus ? (
            <RentPaymentCard
              relationshipId={activeRelationship.id}
              amount={rentStatus.current_amount}
              ownerName={ownerInfo?.full_name || 'Property Owner'}
              propertyName={ownerInfo?.property_name || 'Rental Property'}
              dueDate={rentStatus.due_date}
              status={rentStatus.status}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <h3 className="text-lg font-semibold mb-2">No Rent Set</h3>
                <p className="text-muted-foreground text-center">
                  Your owner hasn't set a monthly rent amount yet. Please contact them to set up rent payments.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <PaymentHistoryList />
        </TabsContent>
      </Tabs>
    </div>
  );
};