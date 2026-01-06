
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
import { Button } from '@/components/ui/button';
import { SlidersHorizontal } from 'lucide-react';

const FindRoom: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    filteredRooms, 
    filters, 
    setFilters, 
    isLoading, 
    clearAllFilters, 
    searchText, 
    setSearchText,
    nearMeActive,
    nearMeLoading,
    nearMeError,
    activateNearMe,
    deactivateNearMe,
  } = useRooms();
  const [tempFilters, setTempFilters] = useState<RoomFilters>(filters);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);
  
  const applyFilters = () => {
    setFilters(tempFilters);
    setShowMobileFilters(false);
  };
  
  const resetFilters = () => {
    setTempFilters({});
  };

  const handleClearFilters = () => {
    clearAllFilters();
    deactivateNearMe();
  };

  // Check if any filters are active
  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof RoomFilters];
    return value !== undefined && value !== '';
  }) || searchText.trim() !== '' || nearMeActive;
  
  if (!user) return null;
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Find Rooms in Kota</h1>
          {hasActiveFilters && (
            <Button 
              onClick={handleClearFilters}
              variant="outline"
              size="sm"
            >
              Clear Filters
            </Button>
          )}
        </div>
        
        {/* Search and Filter Bar */}
        <div className="flex gap-2 mb-4">
          <SearchBar 
            searchText={searchText}
            onSearchChange={setSearchText}
            nearMeActive={nearMeActive}
            nearMeLoading={nearMeLoading}
            onNearMeClick={activateNearMe}
            onNearMeDeactivate={deactivateNearMe}
          />
          
          {/* Mobile Filter Button */}
          <div className="block lg:hidden">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowMobileFilters(true)}
              className="shrink-0"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
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
        
        {/* Promotional Banner - only show when rooms are available */}
        {!isLoading && filteredRooms.length > 0 && (
          <div className="mb-4 p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 rounded-xl border border-primary/20 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 text-center">
              <span className="text-lg">🎉</span>
              <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                <span className="font-semibold text-foreground">New Year Special</span>
                <span className="text-primary font-bold">Get ₹100 OFF</span>
                <span className="text-muted-foreground text-sm">on your first booking</span>
              </div>
              <span className="text-xs text-muted-foreground/80 hidden sm:inline">• Limited time offer</span>
            </div>
          </div>
        )}

        {/* Near Me Status Messages */}
        {nearMeLoading && (
          <div className="mb-4 p-3 bg-muted rounded-lg text-center text-sm text-muted-foreground">
            📍 Finding rooms near you...
          </div>
        )}
        {nearMeActive && !nearMeLoading && (
          <div className="mb-4 p-3 bg-primary/10 rounded-lg text-center text-sm text-primary font-medium">
            📍 Showing rooms near your location
          </div>
        )}
        {nearMeError && (
          <div className="mb-4 p-3 bg-destructive/10 rounded-lg text-center text-sm text-destructive">
            {nearMeError}
          </div>
        )}
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block w-64 shrink-0">
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
              clearFilters={handleClearFilters}
              searchText={searchText}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FindRoom;
