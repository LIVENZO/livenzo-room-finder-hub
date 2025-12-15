
import React, { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchBarProps {
  searchText: string;
  onSearchChange: (text: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchText, onSearchChange }) => {
  const debounceRef = useRef<NodeJS.Timeout>();

  const handleChange = (value: string) => {
    // Debounce the search for smooth instant filtering
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onSearchChange(value);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="flex-1 relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search area or landmark in Kota"
        className="pl-10"
        defaultValue={searchText}
        onChange={(e) => handleChange(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
