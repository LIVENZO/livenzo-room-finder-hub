import { useState } from "react";
import Layout from "@/components/Layout";
import EnhancedRentManagement from "@/components/dashboard/rent-management/EnhancedRentManagement";
import { OwnerPaymentsTab } from "@/components/payments/OwnerPaymentsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, CreditCard } from "lucide-react";

const OwnerRentManagement = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Rent Management</h1>
          
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payments
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <EnhancedRentManagement />
            </TabsContent>
            
            <TabsContent value="payments" className="space-y-6">
              <OwnerPaymentsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default OwnerRentManagement;