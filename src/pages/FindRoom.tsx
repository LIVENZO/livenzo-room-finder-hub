
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useRooms } from '@/context/RoomContext';
import { RoomFilters, SearchLocation } from '@/types/room';
import Layout from '@/components/Layout';
import SearchBar from '@/components/room/SearchBar';
import FilterSidebar from '@/components/room/FilterSidebar';
import MobileFilterSheet from '@/components/room/MobileFilterSheet';
import RoomResults from '@/components/room/RoomResults';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';

const FindRoom: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { filteredRooms, filters, setFilters, isLoading, refreshRooms, clearAllFilters } = useRooms();
  const [tempFilters, setTempFilters] = useState<RoomFilters>(filters);
  const [location, setLocation] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchLabel, setSearchLabel] = useState<string | undefined>();
  
  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);
  
  const handleSearch = (searchLocation?: SearchLocation) => {
    if (searchLocation) {
      setSearchLabel(searchLocation.label);
      setFilters({
        ...filters,
        searchLocation,
        location: undefined, // Clear text-based location filter
      });
    } else {
      setSearchLabel(undefined);
      setFilters({
        ...filters,
        searchLocation: undefined,
        location: undefined,
      });
    }
  };

  const clearSearch = () => {
    setLocation('');
    setSearchLabel(undefined);
    setFilters({
      ...filters,
      searchLocation: undefined,
      location: undefined,
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Find Your Perfect Room</h1>
          <Button 
            onClick={() => {
              clearAllFilters();
              setLocation('');
              setSearchLabel(undefined);
              refreshRooms();
            }}
            disabled={isLoading}
            className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Show All Rooms
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 mb-4">
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

        {/* Search status indicator */}
        {searchLabel && (
          <div className="flex items-center gap-2 mb-4 text-sm">
            <span className="text-muted-foreground">Showing rooms near:</span>
            <span className="font-medium text-primary">{searchLabel}</span>
            {filters.searchLocation?.radius && (
              <span className="text-muted-foreground">
                (within {filters.searchLocation.radius} km)
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-6 px-2"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        )}
        
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
              searchLabel={searchLabel}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FindRoom;
