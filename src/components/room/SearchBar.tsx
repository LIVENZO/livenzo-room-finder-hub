
import React, { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  nearMeActive?: boolean;
  nearMeLoading?: boolean;
  onNearMeClick?: () => void;
  onNearMeDeactivate?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  searchText, 
  onSearchChange,
  nearMeActive = false,
  nearMeLoading = false,
  onNearMeClick,
  onNearMeDeactivate,
}) => {
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

  const handleNearMeClick = () => {
    if (nearMeActive) {
      onNearMeDeactivate?.();
    } else {
      onNearMeClick?.();
    }
  };

  return (
    <div className="flex-1 flex gap-2">
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
      <Button
        variant={nearMeActive ? "default" : "outline"}
        size="default"
        onClick={handleNearMeClick}
        disabled={nearMeLoading}
        className={cn(
          "shrink-0 gap-1.5 transition-all",
          nearMeActive && "bg-primary text-primary-foreground"
        )}
      >
      {nearMeLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : nearMeActive ? (
          <X className="h-4 w-4" />
        ) : (
          <span>📍</span>
        )}
        <span className="text-sm whitespace-nowrap">
          {nearMeLoading ? "Finding..." : nearMeActive ? "Clear" : "Near Me"}
        </span>
      </Button>
    </div>
  );
};

export default SearchBar;
