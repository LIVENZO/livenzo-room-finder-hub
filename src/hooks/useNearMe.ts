
import { useState, useCallback } from 'react';
import { Room } from '@/types/room';
import { calculateDistance } from '@/utils/roomUtils';

interface NearMeState {
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  userLocation: { latitude: number; longitude: number } | null;
}

export const useNearMe = () => {
  const [state, setState] = useState<NearMeState>({
    isActive: false,
    isLoading: false,
    error: null,
    userLocation: null,
  });

  const activateNearMe = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Geolocation is not supported by your browser',
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          isActive: true,
          isLoading: false,
          error: null,
          userLocation: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        });
      },
      (error) => {
        let errorMessage = 'Enable location access to find nearby rooms';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Enable location access to find nearby rooms';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Location information is unavailable';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'Location request timed out';
        }
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  }, []);

  const deactivateNearMe = useCallback(() => {
    setState({
      isActive: false,
      isLoading: false,
      error: null,
      userLocation: null,
    });
  }, []);

  const calculateRoomDistances = useCallback(
    (rooms: Room[]): Room[] => {
      if (!state.userLocation) return rooms;

      return rooms.map((room) => {
        if (room.latitude && room.longitude) {
          const distance = calculateDistance(
            state.userLocation!.latitude,
            state.userLocation!.longitude,
            room.latitude,
            room.longitude
          );
          return { ...room, distance };
        }
        return room;
      });
    },
    [state.userLocation]
  );

  return {
    ...state,
    activateNearMe,
    deactivateNearMe,
    calculateRoomDistances,
  };
};
