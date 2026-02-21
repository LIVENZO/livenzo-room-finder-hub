
import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Hotspot } from '@/services/HotspotService';

interface SearchBarProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  nearMeActive?: boolean;
  nearMeLoading?: boolean;
  onNearMeClick?: () => void;
  onNearMeDeactivate?: () => void;
  // Hotspot props
  hotspotSuggestions?: Hotspot[];
  onHotspotQueryChange?: (query: string) => void;
  onHotspotSelect?: (hotspot: Hotspot) => void;
  activeHotspot?: Hotspot | null;
  onHotspotClear?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  searchText, 
  onSearchChange,
  nearMeActive = false,
  nearMeLoading = false,
  onNearMeClick,
  onNearMeDeactivate,
  hotspotSuggestions = [],
  onHotspotQueryChange,
  onHotspotSelect,
  activeHotspot,
  onHotspotClear,
}) => {
  const debounceRef = useRef<NodeJS.Timeout>();
  const [inputValue, setInputValue] = useState(searchText);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync input when activeHotspot changes
  useEffect(() => {
    if (activeHotspot) {
      setInputValue(activeHotspot.name);
    }
  }, [activeHotspot]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (value: string) => {
    setInputValue(value);

    // If there's an active hotspot and user starts typing differently, clear it
    if (activeHotspot) {
      onHotspotClear?.();
    }

    // Update hotspot suggestions
    onHotspotQueryChange?.(value);
    setShowSuggestions(true);

    // Debounce regular text search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onSearchChange(value);
    }, 300);
  };

  const handleHotspotSelect = (hotspot: Hotspot) => {
    setInputValue(hotspot.name);
    setShowSuggestions(false);
    onHotspotSelect?.(hotspot);
    // Clear text search since hotspot takes over
    onSearchChange('');
  };

  const handleClear = () => {
    setInputValue('');
    setShowSuggestions(false);
    onHotspotClear?.();
    onSearchChange('');
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

  const showClearButton = inputValue.trim() || activeHotspot;

  return (
    <div className="flex-1 flex gap-2">
      <div className="flex-1 relative" ref={wrapperRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <Input
          type="text"
          placeholder="Search area or landmark in Kota"
          className={cn("pl-10", showClearButton && "pr-8")}
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            if (hotspotSuggestions.length > 0) setShowSuggestions(true);
          }}
        />
        {showClearButton && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
            type="button"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}

        {/* Hotspot suggestions dropdown */}
        {showSuggestions && hotspotSuggestions.length > 0 && !activeHotspot && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="px-3 py-1.5 text-xs text-muted-foreground border-b border-border">
              📍 Landmarks
            </div>
            {hotspotSuggestions.map((hotspot) => (
              <button
                key={hotspot.id}
                className="w-full text-left px-3 py-2.5 hover:bg-muted/60 transition-colors flex items-center gap-2 text-sm"
                onClick={() => handleHotspotSelect(hotspot)}
                type="button"
              >
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{hotspot.name}</span>
              </button>
            ))}
          </div>
        )}
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
