
import { useState, useEffect, useCallback, useRef } from 'react';
import { Hotspot, fetchHotspots, findMatchingHotspot, getHotspotSuggestions } from '@/services/HotspotService';

export const useHotspotSearch = () => {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [suggestions, setSuggestions] = useState<Hotspot[]>([]);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchHotspots().then(setHotspots);
    }
  }, []);

  const updateSuggestions = useCallback((query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    setSuggestions(getHotspotSuggestions(query, hotspots));
  }, [hotspots]);

  const detectHotspot = useCallback((query: string): Hotspot | null => {
    return findMatchingHotspot(query, hotspots);
  }, [hotspots]);

  const selectHotspot = useCallback((hotspot: Hotspot) => {
    setActiveHotspot(hotspot);
    setSuggestions([]);
  }, []);

  const clearHotspot = useCallback(() => {
    setActiveHotspot(null);
    setSuggestions([]);
  }, []);

  return {
    hotspots,
    suggestions,
    activeHotspot,
    updateSuggestions,
    detectHotspot,
    selectHotspot,
    clearHotspot,
  };
};
