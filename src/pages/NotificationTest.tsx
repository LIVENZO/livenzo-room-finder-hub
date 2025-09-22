import React from 'react';
import Layout from '@/components/Layout';
import { NotificationTester } from '@/components/test/NotificationTester';

const NotificationTest: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Notification Testing</h1>
          <p className="text-muted-foreground">
            Test notification navigation in web preview environment
          </p>
        </div>
        <NotificationTester />
      </div>
    </Layout>
  );
};

export default NotificationTest;