
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/auth';
import LoadingState from '@/components/landing/LoadingState';
import NoticesList from '@/components/notices/NoticesList';
import { fetchRenterNotices, Notice } from '@/services/NoticeService';
import { supabase } from '@/integrations/supabase/client';

const Notices: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [connectedOwnerId, setConnectedOwnerId] = useState<string | null>(null);

  // Step 1: Fetch active connection (relationship)
  useEffect(() => {
    const getActiveOwner = async () => {
      if (!user) return;
      // Only fetch where status=accepted and not archived; latest (current) connection
      const { data, error } = await supabase
        .from('relationships')
        .select('owner_id')
        .eq('renter_id', user.id)
        .eq('status', 'accepted')
        .eq('archived', false)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        // No need to block page; just don't set owner id
        setConnectedOwnerId(null);
        return;
      }
      setConnectedOwnerId(data?.owner_id ?? null);
    };
    if (user) getActiveOwner();
  }, [user]);

  // Step 2: Fetch all notices for this user
  useEffect(() => {
    const loadNotices = async () => {
      if (user && connectedOwnerId !== undefined) {
        setLoadingNotices(true);
        const fetchedNotices = await fetchRenterNotices();
        // Only show notices from current owner
        const filtered = Array.isArray(fetchedNotices)
          ? fetchedNotices.filter(
              (n) => n.owner_id === connectedOwnerId && n.renter_id === user.id
            )
          : [];
        setNotices(filtered);
        setLoadingNotices(false);
      }
    };
    loadNotices();
  }, [user, connectedOwnerId]);

  // Step 3: Realtime subscription for new notices
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('public:notices-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notices',
          filter: `renter_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotice = payload.new as Notice;
          if (connectedOwnerId && newNotice.owner_id !== connectedOwnerId) return;
          setNotices((prev) => [newNotice, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, connectedOwnerId]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/');
    }
  }, [user, navigate, isLoading]);

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

