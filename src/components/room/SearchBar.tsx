
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { SearchLocation } from '@/types/room';
import { geocodeSearch, getCurrentPosition } from '@/services/GeocodingService';
import { toast } from 'sonner';

interface SearchBarProps {
  location: string;
  setLocation: React.Dispatch<React.SetStateAction<string>>;
  handleSearch: (searchLocation?: SearchLocation) => void;
  searchLabel?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ location, setLocation, handleSearch, searchLabel }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const performSearch = async () => {
    if (!location.trim()) {
      handleSearch(undefined);
      return;
    }

    setIsSearching(true);
    try {
      const searchLocation = await geocodeSearch(location);
      if (searchLocation) {
        handleSearch(searchLocation);
        toast.success(`Showing rooms near ${searchLocation.label}`);
      } else {
        toast.error('Location not found. Try a different search term.');
        handleSearch(undefined);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleNearMe = async () => {
    setIsLocating(true);
    try {
      const currentLocation = await getCurrentPosition();
      setLocation('Near Me');
      handleSearch(currentLocation);
      toast.success('Showing rooms near your location');
    } catch (error) {
      console.error('Location error:', error);
      toast.error('Could not get your location. Please enable location access.');
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="flex-1 flex gap-2">
      <div className="flex-1 relative">
        <Input
          type="text"
          placeholder="Search city, area, or landmark (e.g., 'Kota', 'near Allen')"
          className="pr-12"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && performSearch()}
        />
        <Button
          size="icon"
          className="absolute right-1 top-1 h-8 w-8"
          onClick={performSearch}
          disabled={isSearching}
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={handleNearMe}
        disabled={isLocating}
        title="Find rooms near me"
        className="shrink-0"
      >
        {isLocating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
      </Button>
      {searchLabel && (
        <div className="hidden sm:flex items-center text-sm text-muted-foreground bg-muted px-3 rounded-md">
          {searchLabel}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
