
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, List, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [listingsCount, setListingsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
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
    
    fetchListingsCount();
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
            <h4 className="font-medium mb-1">Add New Listing</h4>
            <p className="text-sm text-gray-500 mb-4">
              Create a new room listing to attract potential renters.
            </p>
            <Button 
              className="w-full"
              onClick={() => navigate('/list-room')}
            >
              <Plus className="h-4 w-4 mr-2" />
              List a New Room
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
