
import { Room } from '@/types/room';

// Helper function to safely parse JSON facilities
export const parseFacilities = (facilitiesJson: any): Room['facilities'] => {
  try {
    // If it's already an object, return it
    if (facilitiesJson && typeof facilitiesJson === 'object' && !Array.isArray(facilitiesJson)) {
      return {
        wifi: Boolean(facilitiesJson.wifi),
        bathroom: Boolean(facilitiesJson.bathroom),
        gender: (facilitiesJson.gender || 'any') as 'male' | 'female' | 'any',
        roomType: (facilitiesJson.roomType || 'single') as 'single' | 'sharing',
        coolingType: facilitiesJson.coolingType as 'ac' | 'cooler' | undefined,
        food: (facilitiesJson.food || 'not_included') as 'included' | 'not_included'
      };
    }
    
    // If it's a string, try to parse it
    if (typeof facilitiesJson === 'string') {
      try {
        const parsed = JSON.parse(facilitiesJson);
        return {
          wifi: Boolean(parsed.wifi),
          bathroom: Boolean(parsed.bathroom),
          gender: (parsed.gender || 'any') as 'male' | 'female' | 'any',
          roomType: (parsed.roomType || 'single') as 'single' | 'sharing',
          coolingType: parsed.coolingType as 'ac' | 'cooler' | undefined,
          food: (parsed.food || 'not_included') as 'included' | 'not_included'
        };
      } catch (e) {
        console.error('Error parsing facilities JSON:', e);
      }
    }
    
    // Return default values if parsing fails
    return {
      wifi: false,
      bathroom: false,
      gender: 'any',
      roomType: 'single',
      food: 'not_included'
    };
  } catch (error) {
    console.error('Error processing facilities:', error);
    return {
      wifi: false,
      bathroom: false,
      gender: 'any',
      roomType: 'single',
      food: 'not_included'
    };
  }
};

// Helper function to map database room response to Room type
export const mapDbRoomToRoom = (data: any): Room => {
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    images: data.images || [],
    price: Number(data.price),
    location: data.location,
    latitude: data.location_latitude ? Number(data.location_latitude) : undefined,
    longitude: data.location_longitude ? Number(data.location_longitude) : undefined,
    facilities: parseFacilities(data.facilities),
    ownerId: data.owner_id,
    ownerPhone: data.owner_phone,
    available: data.available,
    createdAt: data.created_at,
    house_no: data.house_no,
    house_name: data.house_name
  };
};

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Format distance for display
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
};
