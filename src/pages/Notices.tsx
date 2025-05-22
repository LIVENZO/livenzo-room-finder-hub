
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/auth';
import LoadingState from '@/components/landing/LoadingState';
import NoticesList from '@/components/notices/NoticesList';
import { fetchRenterNotices, Notice } from '@/services/NoticeService';

const Notices: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loadingNotices, setLoadingNotices] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/');
    }
  }, [user, navigate, isLoading]);

  useEffect(() => {
    const loadNotices = async () => {
      if (user) {
        setLoadingNotices(true);
        const fetchedNotices = await fetchRenterNotices();
        setNotices(fetchedNotices);
        setLoadingNotices(false);
      }
    };

    loadNotices();
  }, [user]);

  if (isLoading) {
    return <LoadingState isRedirecting={false} />;
  }

  if (!user) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Notices</h1>
        </div>
        
        <NoticesList 
          notices={notices} 
          isLoading={loadingNotices} 
        />
      </div>
    </Layout>
  );
};

export default Notices;
