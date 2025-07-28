import { useAuth } from "@/context/auth";
import { RenterPayments } from "@/components/payments/RenterPayments";
import { OwnerPayments } from "@/components/payments/OwnerPayments";
import Layout from "@/components/Layout";

const Payments = () => {
  const { isOwner } = useAuth();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {isOwner ? <OwnerPayments /> : <RenterPayments />}
      </div>
    </Layout>
  );
};

export default Payments;