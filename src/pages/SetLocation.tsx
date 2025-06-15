
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { fetchUserProfile } from '@/services/UserProfileService';
import LocationSetter from '@/components/profile/LocationSetter';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { toast } from 'sonner';

const SetLocation: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Save where to go after setting location
  const backTo = location.state?.backTo || '/list-room';

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    // Fetch profile to show current location state
    const load = async () => {
      setLoading(true);
      const p = await fetchUserProfile(user.id);
      setProfile(p);
      setLoading(false);
    };
    load();
  }, [user, navigate]);
  
  const handleLocationSaved = useCallback(() => {
    toast.success('Location set successfully! Redirecting...');
    setTimeout(() => {
      navigate(backTo, { replace: true });
    }, 1000);
  }, [navigate, backTo]);

  if (!user) return null;

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-80">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto py-10 animate-fade-in">
        <h2 className="text-2xl font-bold mb-4">Set Your Property Location</h2>
        <p className="mb-4 text-gray-600">
          Before listing a room, add your property location so renters can find you easily. 
        </p>
        <LocationSetter
          userId={user.id}
          profile={profile}
          onLocationSaved={handleLocationSaved}
        />
      </div>
    </Layout>
  );
};

export default SetLocation;
