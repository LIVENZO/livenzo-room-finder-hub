import { useState, useMemo, useRef } from 'react';
import { Room, RoomFilters } from '@/types/room';
import { fetchTopRoomIds } from '@/services/topRoomsService';
import { calculateDistance } from '@/utils/roomUtils';
import { Hotspot } from '@/services/HotspotService';

// Price bucket thresholds
const PRICE_THRESHOLDS = {
  LOW_MAX: 4000,
  MEDIUM_MAX: 7000,
};

type PriceBucket = 'low' | 'medium' | 'high';
type SortStrategy = 'high_to_low' | 'premium_focused' | 'premium_mid_focus' | 'smart_premium_mix';

const getPriceBucket = (price: number): PriceBucket => {
  if (price <= PRICE_THRESHOLDS.LOW_MAX) return 'low';
  if (price <= PRICE_THRESHOLDS.MEDIUM_MAX) return 'medium';
  return 'high';
};

const getRandomStrategy = (): SortStrategy => {
  const strategies: SortStrategy[] = ['high_to_low', 'premium_focused', 'premium_mid_focus', 'smart_premium_mix'];
  return strategies[Math.floor(Math.random() * strategies.length)];
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const applyStrategy = (rooms: Room[], strategy: SortStrategy): Room[] => {
  switch (strategy) {
    case 'high_to_low':
      return [...rooms].sort((a, b) => b.price - a.price);

    case 'premium_focused': {
      const high = rooms.filter(r => getPriceBucket(r.price) === 'high');
      const medium = rooms.filter(r => getPriceBucket(r.price) === 'medium');
      const low = rooms.filter(r => getPriceBucket(r.price) === 'low');
      return [
        ...high.sort((a, b) => b.price - a.price),
        ...medium.sort((a, b) => b.price - a.price),
        ...low.sort((a, b) => b.price - a.price),
      ];
    }

    case 'premium_mid_focus': {
      const highMed = rooms.filter(r => getPriceBucket(r.price) !== 'low');
      const low = rooms.filter(r => getPriceBucket(r.price) === 'low');
      return [
        ...shuffleArray(highMed),
        ...low.sort((a, b) => b.price - a.price),
      ];
    }

    case 'smart_premium_mix': {
      const high = rooms.filter(r => getPriceBucket(r.price) === 'high');
      const medium = rooms.filter(r => getPriceBucket(r.price) === 'medium');
      const low = rooms.filter(r => getPriceBucket(r.price) === 'low');
      return [
        ...shuffleArray(high),
        ...shuffleArray(medium),
        ...shuffleArray(low),
      ];
    }

    default:
      return [...rooms].sort((a, b) => b.price - a.price);
  }
};

const HOTSPOT_RADIUS_KM = 2;

export const useRoomFilters = (rooms: Room[], activeHotspot: Hotspot | null = null) => {
  const [filters, setFilters] = useState<RoomFilters>({});
  const [searchText, setSearchText] = useState('');
  
  const strategyRef = useRef<SortStrategy>(getRandomStrategy());
  const topRoomIdsRef = useRef<Set<string>>(new Set());
  const fetchedRef = useRef(false);

  if (!fetchedRef.current) {
    fetchedRef.current = true;
    fetchTopRoomIds().then(ids => {
      topRoomIdsRef.current = new Set(ids);
    });
  }

  const clearAllFilters = () => {
    setFilters({});
    setSearchText('');
  };

  const filteredRooms = useMemo(() => {
    let result = rooms.filter(room => {
      if (room.available === false) return false;

      // If hotspot is active, filter by geo-distance instead of text search
      if (activeHotspot) {
        if (room.latitude != null && room.longitude != null) {
          const dist = calculateDistance(
            activeHotspot.latitude,
            activeHotspot.longitude,
            room.latitude,
            room.longitude
          );
          if (dist > HOTSPOT_RADIUS_KM) return false;
        } else {
          // Room has no coordinates, exclude from hotspot results
          return false;
        }
      } else if (searchText.trim()) {
        // Existing text search logic (unchanged)
        const searchLower = searchText.toLowerCase().trim();
        const locationMatch = room.location?.toLowerCase().includes(searchLower);
        const titleMatch = room.title?.toLowerCase().includes(searchLower);
        if (!locationMatch && !titleMatch) return false;
      }
      
      if (filters.maxPrice && room.price > filters.maxPrice) return false;
      if (filters.wifi && !room.facilities.wifi) return false;
      if (filters.bathroom && !room.facilities.bathroom) return false;
      if (filters.gender && room.facilities.gender !== 'any' && room.facilities.gender !== filters.gender) return false;
      if (filters.roomType && room.facilities.roomType !== filters.roomType) return false;
      if (filters.coolingType && room.facilities.coolingType !== filters.coolingType) return false;
      if (filters.food && room.facilities.food !== filters.food) return false;
      
      return true;
    });

    // If hotspot is active, sort by distance from hotspot
    if (activeHotspot) {
      result.sort((a, b) => {
        const distA = calculateDistance(activeHotspot.latitude, activeHotspot.longitude, a.latitude!, a.longitude!);
        const distB = calculateDistance(activeHotspot.latitude, activeHotspot.longitude, b.latitude!, b.longitude!);
        return distA - distB;
      });
      // Attach distance for display
      result = result.map(room => ({
        ...room,
        distance: calculateDistance(activeHotspot.latitude, activeHotspot.longitude, room.latitude!, room.longitude!),
      }));
      return result;
    }

    // Existing sorting logic (unchanged)
    const hasDistanceData = result.some(room => room.distance !== undefined);

    if (hasDistanceData) {
      result.sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) {
          if (a.distance !== b.distance) return a.distance - b.distance;
        } else if (a.distance !== undefined) {
          return -1;
        } else if (b.distance !== undefined) {
          return 1;
        }
        return b.price - a.price;
      });
    } else if (topRoomIdsRef.current.size > 0) {
      const topRooms = result.filter(r => topRoomIdsRef.current.has(r.id));
      const remainingRooms = result.filter(r => !topRoomIdsRef.current.has(r.id));

      const topHigh = shuffleArray(topRooms.filter(r => getPriceBucket(r.price) === 'high'));
      const topMed = shuffleArray(topRooms.filter(r => getPriceBucket(r.price) === 'medium'));
      const topLow = shuffleArray(topRooms.filter(r => getPriceBucket(r.price) === 'low'));
      const orderedTop = [...topHigh, ...topMed, ...topLow];

      const orderedRemaining = applyStrategy(remainingRooms, strategyRef.current);

      result = [...orderedTop, ...orderedRemaining];
    } else {
      result = applyStrategy(result, strategyRef.current);
    }

    return result;
  }, [rooms, filters, searchText, activeHotspot]);

  return { 
    filters, 
    setFilters, 
    filteredRooms, 
    clearAllFilters,
    searchText,
    setSearchText
  };
};
