
import { useState, useMemo, useRef, useEffect } from 'react';
import { Room, RoomFilters } from '@/types/room';
import { fetchTopRoomIds } from '@/services/topRoomsService';

// Price bucket thresholds
const PRICE_THRESHOLDS = {
  LOW_MAX: 4000,      // Low: ≤ ₹4000
  MEDIUM_MAX: 7000,   // Medium: ₹4001 - ₹7000
                      // High: > ₹7000
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

// Shuffle array using Fisher-Yates algorithm
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

export const useRoomFilters = (rooms: Room[]) => {
  const [filters, setFilters] = useState<RoomFilters>({});
  const [searchText, setSearchText] = useState('');
  const [topRoomIds, setTopRoomIds] = useState<Set<string>>(new Set());
  
  // Store the strategy for this session (changes on component mount)
  const strategyRef = useRef<SortStrategy>(getRandomStrategy());

  // Fetch top room IDs once
  useEffect(() => {
    fetchTopRoomIds().then(ids => setTopRoomIds(new Set(ids)));
  }, []);

  const clearAllFilters = () => {
    setFilters({});
    setSearchText('');
  };

  // Filter and sort rooms based on user criteria
  const filteredRooms = useMemo(() => {
    let result = rooms.filter(room => {
      if (room.available === false) return false;

      if (searchText.trim()) {
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

    // Check if any room has distance (near me is active)
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
    } else if (topRoomIds.size > 0) {
      // Split into top rooms and remaining
      const topRooms = result.filter(r => topRoomIds.has(r.id));
      const remainingRooms = result.filter(r => !topRoomIds.has(r.id));

      // Shuffle top rooms with premium-first feel (high > med > low, shuffled within buckets)
      const topHigh = shuffleArray(topRooms.filter(r => getPriceBucket(r.price) === 'high'));
      const topMed = shuffleArray(topRooms.filter(r => getPriceBucket(r.price) === 'medium'));
      const topLow = shuffleArray(topRooms.filter(r => getPriceBucket(r.price) === 'low'));
      const orderedTop = [...topHigh, ...topMed, ...topLow];

      // Apply existing strategy to remaining rooms
      const orderedRemaining = applyStrategy(remainingRooms, strategyRef.current);

      result = [...orderedTop, ...orderedRemaining];
    } else {
      // Fallback: use existing strategy (all premium-first, never low-to-high)
      result = applyStrategy(result, strategyRef.current);
    }

    return result;
  }, [rooms, filters, searchText, topRoomIds]);

  return { 
    filters, 
    setFilters, 
    filteredRooms, 
    clearAllFilters,
    searchText,
    setSearchText
  };
};
