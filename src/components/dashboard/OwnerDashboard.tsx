
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, List, Loader2, UsersIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { fetchOwnerRelationships } from '@/services/relationship';
import { Relationship } from '@/types/relationship';
import { Badge } from '@/components/ui/badge';

const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
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
  
  return (
    <div className="py-12 bg-gray-50 rounded-lg">
      <div className="text-center mb-8">
        <h3 className="text-xl font-medium mb-2">You're signed in as a property owner</h3>
        <p className="text-gray-500">
          List your rooms and connect with potential renters.
        </p>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg border">
            <h4 className="font-medium mb-1">Your Listings</h4>
            {isLoading ? (
              <div className="flex justify-center my-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold mb-4">{listingsCount}</p>
                <p className="text-sm text-gray-500 mb-4">
                  {listingsCount === 0 
                    ? "You haven't listed any rooms yet." 
                    : `You have ${listingsCount} active room ${listingsCount === 1 ? 'listing' : 'listings'}.`}
                </p>
                <Button 
                  variant={listingsCount > 0 ? "outline" : "default"} 
                  className="w-full"
                  onClick={() => navigate('/my-listings')}
                >
                  <List className="h-4 w-4 mr-2" />
                  {listingsCount > 0 ? 'View All Listings' : 'List Your First Room'}
                </Button>
              </>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-lg border">
            <h4 className="font-medium mb-1">Connection Requests</h4>
            {loadingConnections ? (
              <div className="flex justify-center my-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="flex items-center mb-4">
                  <p className="text-3xl font-bold">{pendingConnections}</p>
                  {pendingConnections > 0 && (
                    <Badge variant="destructive" className="ml-2">New</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  {pendingConnections === 0 
                    ? "No pending connection requests." 
                    : `You have ${pendingConnections} pending connection ${pendingConnections === 1 ? 'request' : 'requests'}.`}
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/connections')}
                >
                  <UsersIcon className="h-4 w-4 mr-2" />
                  Manage Connections
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
