
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface SearchBarProps {
  location: string;
  setLocation: React.Dispatch<React.SetStateAction<string>>;
  handleSearch: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ location, setLocation, handleSearch }) => {
  return (
    <div className="flex-1 relative">
      <Input
        type="text"
        placeholder="Enter location (city, zip code)"
        className="pr-12"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
      />
      <Button
        size="icon"
        className="absolute right-1 top-1 h-8 w-8"
        onClick={handleSearch}
      >
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default SearchBar;
