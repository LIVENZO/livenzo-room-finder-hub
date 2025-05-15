
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useRooms } from '@/context/RoomContext';
import { RoomFilters } from '@/types/room';
import Layout from '@/components/Layout';
import SearchBar from '@/components/room/SearchBar';
import FilterSidebar from '@/components/room/FilterSidebar';
import MobileFilterSheet from '@/components/room/MobileFilterSheet';
import RoomResults from '@/components/room/RoomResults';

const FindRoom: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { filteredRooms, filters, setFilters, isLoading } = useRooms();
  const [tempFilters, setTempFilters] = useState<RoomFilters>(filters);
  const [location, setLocation] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);
  
  const handleSearch = () => {
    setFilters({
      ...filters,
      location,
    });
  };
  
  const applyFilters = () => {
    setFilters(tempFilters);
    setShowMobileFilters(false);
  };
  
  const resetFilters = () => {
    setTempFilters({});
  };
  
  if (!user) return null;
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-6">Find Your Perfect Room</h1>
        
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <SearchBar 
            location={location} 
            setLocation={setLocation} 
            handleSearch={handleSearch} 
          />
          
          <div className="block md:hidden">
            <MobileFilterSheet
              showMobileFilters={showMobileFilters}
              setShowMobileFilters={setShowMobileFilters}
              tempFilters={tempFilters}
              setTempFilters={setTempFilters}
              resetFilters={resetFilters}
              applyFilters={applyFilters}
            />
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="hidden md:block w-full lg:w-64 space-y-6">
            <FilterSidebar
              tempFilters={tempFilters}
              setTempFilters={setTempFilters}
              resetFilters={resetFilters}
              applyFilters={applyFilters}
            />
          </div>
          
          <div className="flex-1">
            <RoomResults 
              isLoading={isLoading} 
              filteredRooms={filteredRooms} 
              resetFilters={resetFilters} 
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FindRoom;
