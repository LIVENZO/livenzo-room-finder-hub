
import { useCallback, useEffect, useRef, useState } from 'react';
import { Room } from '@/types/room';
import { calculateDistance } from '@/utils/roomUtils';

interface NearMeState {
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  userLocation: { latitude: number; longitude: number } | null;
}

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 300000, // 5 minutes cache
};

export const useNearMe = () => {
  const [state, setState] = useState<NearMeState>({
    isActive: false,
    isLoading: false,
    error: null,
    userLocation: null,
  });

  // Keeps a reference to the permission status object so we can auto-retry
  // as soon as the user grants access (avoids a second "Near Me" tap).
  const permissionStatusRef = useRef<PermissionStatus | null>(null);
  const permissionHandlerRef = useRef<(() => void) | null>(null);
  const cancelledRef = useRef(false);

  const detachPermissionListener = useCallback(() => {
    if (permissionStatusRef.current && permissionHandlerRef.current) {
      permissionStatusRef.current.removeEventListener('change', permissionHandlerRef.current);
    }
    permissionStatusRef.current = null;
    permissionHandlerRef.current = null;
  }, []);

  const requestPosition = useCallback(() => {
    cancelledRef.current = false;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelledRef.current) return;
        detachPermissionListener();
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
        if (cancelledRef.current) return;

        let errorMessage = 'Enable location access to find nearby rooms';
        if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Location information is unavailable';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'Location request timed out';
        }

        setState(prev => ({
          ...prev,
          isActive: false,
          isLoading: false,
          error: errorMessage,
        }));
      },
      GEO_OPTIONS
    );
  }, [detachPermissionListener]);

  const activateNearMe = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Geolocation is not supported by your browser',
      }));
      return;
    }

    // Watch permission state so a grant immediately triggers the search.
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((status) => {
          detachPermissionListener();
          const handler = () => {
            if (status.state === 'granted' && !cancelledRef.current) {
              requestPosition();
            }
          };
          status.addEventListener('change', handler);
          permissionStatusRef.current = status;
          permissionHandlerRef.current = handler;
        })
        .catch(() => {
          /* permissions API unavailable — plain flow still works */
        });
    }

    requestPosition();
  }, [detachPermissionListener, requestPosition]);

  const deactivateNearMe = useCallback(() => {
    cancelledRef.current = true;
    detachPermissionListener();
    setState({
      isActive: false,
      isLoading: false,
      error: null,
      userLocation: null,
    });
  }, [detachPermissionListener]);

  useEffect(() => detachPermissionListener, [detachPermissionListener]);

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
