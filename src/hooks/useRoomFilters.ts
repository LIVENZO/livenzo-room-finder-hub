
import { useState, useMemo, useRef } from 'react';
import { Room, RoomFilters } from '@/types/room';

// Price bucket thresholds
const PRICE_THRESHOLDS = {
  LOW_MAX: 4000,      // Low: ≤ ₹4000
  MEDIUM_MAX: 7000,   // Medium: ₹4001 - ₹7000
                      // High: > ₹7000
};

type PriceBucket = 'low' | 'medium' | 'high';
type SortStrategy = 'low_to_high' | 'high_to_low' | 'budget_focused' | 'premium_focused' | 'smart_mix';

const getPriceBucket = (price: number): PriceBucket => {
  if (price <= PRICE_THRESHOLDS.LOW_MAX) return 'low';
  if (price <= PRICE_THRESHOLDS.MEDIUM_MAX) return 'medium';
  return 'high';
};

const getRandomStrategy = (): SortStrategy => {
  const strategies: SortStrategy[] = ['high_to_low', 'budget_focused', 'premium_focused', 'smart_mix'];
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
    case 'low_to_high':
      return [...rooms].sort((a, b) => a.price - b.price);
    
    case 'high_to_low':
      return [...rooms].sort((a, b) => b.price - a.price);
    
    case 'budget_focused': {
      // Prioritize low and medium price rooms
      const lowMedium = rooms.filter(r => getPriceBucket(r.price) !== 'high');
      const high = rooms.filter(r => getPriceBucket(r.price) === 'high');
      return [...lowMedium.sort((a, b) => a.price - b.price), ...high.sort((a, b) => a.price - b.price)];
    }
    
    case 'premium_focused': {
      // Prioritize medium and high price rooms
      const mediumHigh = rooms.filter(r => getPriceBucket(r.price) !== 'low');
      const low = rooms.filter(r => getPriceBucket(r.price) === 'low');
      return [...mediumHigh.sort((a, b) => b.price - a.price), ...low.sort((a, b) => a.price - b.price)];
    }
    
    case 'smart_mix': {
      // ~30% low & mid-range, ~70% premium, then shuffled
      const lowMedium = rooms.filter(r => getPriceBucket(r.price) !== 'high');
      const high = rooms.filter(r => getPriceBucket(r.price) === 'high');
      
      // Calculate target counts
      const totalCount = rooms.length;
      const targetHighCount = Math.ceil(totalCount * 0.7);
      const targetLowMediumCount = totalCount - targetHighCount;
      
      // Take proportional amounts (or all if not enough)
      const selectedHigh = shuffleArray(high).slice(0, targetHighCount);
      const selectedLowMedium = shuffleArray(lowMedium).slice(0, targetLowMediumCount);
      
      // Combine and shuffle for natural discovery
      return shuffleArray([...selectedHigh, ...selectedLowMedium, 
        ...high.slice(targetHighCount), 
        ...lowMedium.slice(targetLowMediumCount)]);
    }
    
    default:
      return [...rooms].sort((a, b) => a.price - b.price);
  }
};

export const useRoomFilters = (rooms: Room[]) => {
  const [filters, setFilters] = useState<RoomFilters>({});
  const [searchText, setSearchText] = useState('');
  
  // Store the strategy for this session (changes on component mount)
  const strategyRef = useRef<SortStrategy>(getRandomStrategy());

  const clearAllFilters = () => {
    setFilters({});
    setSearchText('');
  };

  // Filter and sort rooms based on user criteria
  const filteredRooms = useMemo(() => {
    let result = rooms.filter(room => {
      // Filter out unavailable rooms first
      if (room.available === false) {
        return false;
      }

      // Text-based search on location/area name (case-insensitive)
      if (searchText.trim()) {
        const searchLower = searchText.toLowerCase().trim();
        const locationMatch = room.location?.toLowerCase().includes(searchLower);
        const titleMatch = room.title?.toLowerCase().includes(searchLower);
        if (!locationMatch && !titleMatch) {
          return false;
        }
      }
      
      // Filter by max price
      if (filters.maxPrice && room.price > filters.maxPrice) {
        return false;
      }
      
      // Filter by wifi
      if (filters.wifi && !room.facilities.wifi) {
        return false;
      }
      
      // Filter by bathroom
      if (filters.bathroom && !room.facilities.bathroom) {
        return false;
      }
      
      // Filter by gender preference
      if (filters.gender && room.facilities.gender !== 'any' && room.facilities.gender !== filters.gender) {
        return false;
      }
      
      // Filter by room type
      if (filters.roomType && room.facilities.roomType !== filters.roomType) {
        return false;
      }
      
      // Filter by cooling type
      if (filters.coolingType && room.facilities.coolingType !== filters.coolingType) {
        return false;
      }
      
      // Filter by food
      if (filters.food && room.facilities.food !== filters.food) {
        return false;
      }
      
      return true;
    });

    // Check if any room has distance (near me is active)
    const hasDistanceData = result.some(room => room.distance !== undefined);

    if (hasDistanceData) {
      // When near me is active, sort by distance first, then apply strategy for price tie-breaking
      result.sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) {
          if (a.distance !== b.distance) {
            return a.distance - b.distance;
          }
        } else if (a.distance !== undefined) {
          return -1;
        } else if (b.distance !== undefined) {
          return 1;
        }
        // For same distance, fall back to price order
        return a.price - b.price;
      });
    } else {
      // Apply dynamic ordering strategy when near me is not active
      result = applyStrategy(result, strategyRef.current);
    }

    return result;
  }, [rooms, filters, searchText]);

  return { 
    filters, 
    setFilters, 
    filteredRooms, 
    clearAllFilters,
    searchText,
    setSearchText
  };
};
