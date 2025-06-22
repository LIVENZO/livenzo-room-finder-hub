
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { fetchOwnerRelationships } from '@/services/relationship';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { fetchUserProfile } from '@/services/UserProfileService';
import { toast } from 'sonner';
import WelcomeHeader from './components/WelcomeHeader';
import OwnerDashboardTabs from './components/OwnerDashboardTabs';

const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requireOwnerComplete } = useProfileCompletion();
  
  const [listingsCount, setListingsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingConnections, setPendingConnections] = useState(0);
  const [loadingConnections, setLoadingConnections] = useState(true);
  
  useEffect(() => {
    if (!user) return;
    
    const fetchListingsCount = async () => {
      try {
        const { count, error } = await supabase
          .from('rooms')
          .select('id', { count: 'exact' })
          .eq('owner_id', user.id);
          
        if (error) {
          console.error('Error fetching listings count:', error);
          return;
        }
        
        setListingsCount(count || 0);
      } catch (error) {
        console.error('Error in fetchListingsCount:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchConnectionRequests = async () => {
      setLoadingConnections(true);
      try {
        const relationships = await fetchOwnerRelationships(user.id);
        const pending = relationships.filter(r => r.status === 'pending').length;
        setPendingConnections(pending);
        console.log(`Found ${pending} pending connection requests`);
      } catch (error) {
        console.error('Error fetching connection requests:', error);
      } finally {
        setLoadingConnections(false);
      }
    };
    
    fetchListingsCount();
    fetchConnectionRequests();
  }, [user]);

  const handleListRoomClick = async () => {
    if (!user) return;
    
    try {
      // First check if location is set
      const profile = await fetchUserProfile(user.id);
      const hasValidLocation =
        !!profile?.location_latitude &&
        !!profile?.location_longitude &&
        typeof profile.location_latitude === "number" &&
        typeof profile.location_longitude === "number";
        
      if (!hasValidLocation) {
        toast.info('Set your property location before listing a room.');
        navigate('/set-location', { replace: true, state: { backTo: '/list-room' } });
        return;
      }
      
      // Then check if owner profile is complete
      const profileComplete = requireOwnerComplete();
      if (!profileComplete) return;
      
      // Location is set and profile is complete, proceed to listing
      navigate('/list-room');
    } catch (error) {
      console.error('Error checking location:', error);
      toast.error('Failed to check location. Please try again.');
    }
  };

  const handleViewListingsClick = () => {
    requireOwnerComplete(() => navigate('/my-listings'));
  };

  const handleManageConnectionsClick = () => {
    requireOwnerComplete(() => navigate('/connections'));
  };

  const handleStatsCardClick = (type: 'listings' | 'connections') => {
    if (type === 'listings' && listingsCount > 0) {
      handleViewListingsClick();
    } else if (type === 'connections') {
      // Always allow clicking on connections, regardless of pending count
      handleManageConnectionsClick();
    }
  };

  if (!user) return null;
  
  return (
    <div className="space-y-8 animate-fade-in">
      <WelcomeHeader />
      
      <OwnerDashboardTabs
        listingsCount={listingsCount}
        isLoading={isLoading}
        pendingConnections={pendingConnections}
        loadingConnections={loadingConnections}
        onStatsCardClick={handleStatsCardClick}
        onListRoomClick={handleListRoomClick}
        onViewListingsClick={handleViewListingsClick}
        onManageConnectionsClick={handleManageConnectionsClick}
        userId={user.id}
      />

      {/* Background decorative elements */}
      <div className="fixed top-1/3 right-1/4 opacity-5 pointer-events-none">
        <Home className="h-48 w-48 text-primary-300 animate-float" />
      </div>
    </div>
  );
};

export default OwnerDashboard;
