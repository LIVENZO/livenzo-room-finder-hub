import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import SetRentListPage from '@/components/dashboard/rent-management/SetRentListPage';

const SetMonthlyRent: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <SetRentListPage onBack={() => navigate(-1)} />
    </Layout>
  );
};

export default SetMonthlyRent;
