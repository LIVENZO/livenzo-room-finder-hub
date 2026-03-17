
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
  hotspotSuggestions?: Hotspot[];
  onHotspotQueryChange?: (query: string) => void;
  onHotspotSelect?: (hotspot: Hotspot) => void;
  activeHotspot?: Hotspot | null;
  onHotspotClear?: () => void;
  allHotspots?: Hotspot[];
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
  allHotspots = [],
}) => {
  const debounceRef = useRef<NodeJS.Timeout>();
  const [inputValue, setInputValue] = useState(searchText);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);

  // Rotate placeholder hotspot names
  useEffect(() => {
    if (allHotspots.length === 0 || inputValue.trim()) return;
    const interval = setInterval(() => {
      setPlaceholderVisible(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % allHotspots.length);
        setPlaceholderVisible(true);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, [allHotspots.length, inputValue]);

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
    if (activeHotspot) {
      onHotspotClear?.();
    }
    onHotspotQueryChange?.(value);
    setShowSuggestions(true);
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
  const currentPlaceholder = allHotspots.length > 0 && !inputValue.trim()
    ? allHotspots[placeholderIndex]?.name ?? ''
    : '';

  return (
    <div className="flex-1 flex gap-2">
      <div className="flex-1 relative" ref={wrapperRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        
        {/* Custom animated placeholder */}
        {!inputValue.trim() && currentPlaceholder && (
          <div 
            className={cn(
              "absolute left-10 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none z-[1] transition-all duration-300 ease-in-out",
              placeholderVisible ? "opacity-100 translate-y-[-50%]" : "opacity-0 translate-y-[calc(-50%-6px)]"
            )}
          >
            {currentPlaceholder}
          </div>
        )}

        <Input
          type="text"
          placeholder=""
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
