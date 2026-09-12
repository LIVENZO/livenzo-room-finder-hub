import { useAuth } from "@/context/auth";
import { PayRentSection } from "@/components/renter/PayRentSection";
import { OwnerPayments } from "@/components/payments/OwnerPayments";
import Layout from "@/components/Layout";
import { useLocation } from "react-router-dom";
import Seo, { OG_HOME } from '@/components/seo/Seo';

const Payments = () => {
  const { isOwner } = useAuth();
  const location = useLocation();
  const pendingPaymentId = location.state?.pendingPaymentId;

  return (
    <Layout>
      <Seo
        title="Rent Payments | Livenzo"
        description="View monthly rent, electricity bills and payment status, and pay your rent securely on Livenzo."
        path="/payments"
        image={OG_HOME}
        noindex
      />
      <h1 className="sr-only">Rent payments</h1>
      <div className="container mx-auto px-4 py-6">
        {isOwner ? (
          <OwnerPayments />
        ) : (
          <PayRentSection />
        )}
      </div>
    </Layout>
  );
};

export default Payments;