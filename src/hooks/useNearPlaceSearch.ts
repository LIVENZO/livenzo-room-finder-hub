import { useState, useCallback, useRef } from 'react';
import { Room } from '@/types/room';
import { calculateDistance } from '@/utils/roomUtils';
import { geocodeSearch } from '@/services/GeocodingService';

interface NearPlaceState {
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  placeName: string | null;
  placeCoords: { latitude: number; longitude: number } | null;
}

const NEAR_RADIUS_KM = 1;
const WALKING_SPEED_KMH = 5; // Average walking speed

// Detect "near [place]" pattern in search text
const extractNearPlace = (text: string): string | null => {
  const match = text.match(/\bnear\s+(.+)/i);
  if (match && match[1].trim().length >= 2) {
    return match[1].trim();
  }
  return null;
};

// Estimate walking duration from distance
const estimateWalkingDuration = (distanceKm: number): string => {
  const minutes = Math.round((distanceKm / WALKING_SPEED_KMH) * 60);
  if (minutes < 1) return '1 min';
  if (minutes === 1) return '1 min';
  return `${minutes} mins`;
};

export const useNearPlaceSearch = () => {
  const [state, setState] = useState<NearPlaceState>({
    isActive: false,
    isLoading: false,
    error: null,
    placeName: null,
    placeCoords: null,
  });

  const lastSearchedPlace = useRef<string | null>(null);

  const searchNearPlace = useCallback(async (searchText: string, rooms: Room[]): Promise<Room[] | null> => {
    const placeName = extractNearPlace(searchText);

    // If no "near" pattern, deactivate and return null (use normal search)
    if (!placeName) {
      if (state.isActive) {
        setState({ isActive: false, isLoading: false, error: null, placeName: null, placeCoords: null });
      }
      lastSearchedPlace.current = null;
      return null;
    }

    // Skip if same place already searched
    if (placeName.toLowerCase() === lastSearchedPlace.current?.toLowerCase() && state.isActive && state.placeCoords) {
      return filterAndEnrichRooms(rooms, state.placeCoords, state.placeName || placeName);
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    lastSearchedPlace.current = placeName;

    try {
      // Use GeocodingService (Nominatim + known landmarks) to geocode
      const geoResult = await geocodeSearch(placeName);

      if (!geoResult) {
        setState({
          isActive: false,
          isLoading: false,
          error: `Could not find "${placeName}". Try a different place name.`,
          placeName,
          placeCoords: null,
        });
        return [];
      }

      const placeCoords = { latitude: geoResult.latitude, longitude: geoResult.longitude };
      const resolvedName = geoResult.label || placeName;

      setState({
        isActive: true,
        isLoading: false,
        error: null,
        placeName: resolvedName,
        placeCoords,
      });

      return filterAndEnrichRooms(rooms, placeCoords, resolvedName);
    } catch (err) {
      console.error('Near place search error:', err);
      setState({
        isActive: false,
        isLoading: false,
        error: 'Failed to search near this place. Please try again.',
        placeName,
        placeCoords: null,
      });
      return [];
    }
  }, [state.isActive, state.placeCoords, state.placeName]);

  const filterAndEnrichRooms = (
    rooms: Room[],
    placeCoords: { latitude: number; longitude: number },
    placeName: string
  ): Room[] => {
    // Filter rooms within 1km radius and calculate distances
    const nearbyRooms = rooms
      .filter(room => {
        if (!room.latitude || !room.longitude) return false;
        if (room.available === false) return false;
        const dist = calculateDistance(placeCoords.latitude, placeCoords.longitude, room.latitude, room.longitude);
        return dist <= NEAR_RADIUS_KM;
      })
      .map(room => {
        const dist = calculateDistance(placeCoords.latitude, placeCoords.longitude, room.latitude!, room.longitude!);
        return {
          ...room,
          distance: dist,
          walkingDuration: estimateWalkingDuration(dist),
          walkingDistance: dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`,
        };
      })
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

    return nearbyRooms;
  };

  const resetNearPlace = useCallback(() => {
    setState({ isActive: false, isLoading: false, error: null, placeName: null, placeCoords: null });
    lastSearchedPlace.current = null;
  }, []);

  return {
    ...state,
    searchNearPlace,
    resetNearPlace,
    extractNearPlace,
  };
};
