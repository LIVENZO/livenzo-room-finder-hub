import Layout from "@/components/Layout";
import EnhancedRentManagement from "@/components/dashboard/rent-management/EnhancedRentManagement";

const OwnerRentManagement = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <EnhancedRentManagement />
      </div>
    </Layout>
  );
};

export default OwnerRentManagement;