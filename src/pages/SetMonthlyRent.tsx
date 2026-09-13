import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import SetRentListPage from '@/components/dashboard/rent-management/SetRentListPage';
import Seo, { OG_HOME } from '@/components/seo/Seo';

const SetMonthlyRent: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <Seo
        title="Set Monthly Rent | Livenzo"
        description="Set or update monthly rent and payment details for each renter in your property."
        path="/set-monthly-rent"
        image={OG_HOME}
        noindex
      />
      <SetRentListPage onBack={() => navigate(-1)} />
    </Layout>
  );
};

export default SetMonthlyRent;
