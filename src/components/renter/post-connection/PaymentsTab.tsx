
import React from 'react';
import RenterPayments from '@/components/renter/RenterPayments';

interface PaymentsTabProps {
  relationshipId: string;
}

const PaymentsTab: React.FC<PaymentsTabProps> = ({ relationshipId }) => {
  return <RenterPayments relationshipId={relationshipId} />;
};

export default PaymentsTab;
