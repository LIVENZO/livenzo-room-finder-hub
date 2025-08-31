import { useAuth } from "@/context/auth";
import { PayRentSection } from "@/components/renter/PayRentSection";
import { OwnerPayments } from "@/components/payments/OwnerPayments";
import Layout from "@/components/Layout";

const Payments = () => {
  const { isOwner } = useAuth();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {isOwner ? <OwnerPayments /> : <PayRentSection />}
      </div>
    </Layout>
  );
};

export default Payments;