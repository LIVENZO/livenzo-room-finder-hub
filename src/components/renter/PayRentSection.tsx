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

export const PayRentSection = () => {
  const [activeRelationship, setActiveRelationship] = useState<Relationship | null>(null);
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
      
      const { data, error } = await supabase
        .from('relationships')
        .select('*')
        .eq('renter_id', user.id)
        .eq('status', 'accepted')
        .eq('archived', false)
        .maybeSingle();

      if (error) {
        console.error('Error fetching relationship:', error);
        toast.error('Failed to load rental information');
        return;
      }

      setActiveRelationship(data);
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
          <RentPaymentCard
            relationshipId={activeRelationship.id}
            amount={12000} // Default rent amount - this could be fetched from a rent_status table
            ownerName="Property Owner"
            propertyName="Rental Property"
            dueDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()} // 7 days from now
            status="pending"
          />
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <PaymentHistoryList />
        </TabsContent>
      </Tabs>
    </div>
  );
};