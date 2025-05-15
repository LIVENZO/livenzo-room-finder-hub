
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
        roomType: (facilitiesJson.roomType || 'single') as 'single' | 'sharing'
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
          roomType: (parsed.roomType || 'single') as 'single' | 'sharing'
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
      roomType: 'single'
    };
  } catch (error) {
    console.error('Error processing facilities:', error);
    return {
      wifi: false,
      bathroom: false,
      gender: 'any',
      roomType: 'single'
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
    facilities: parseFacilities(data.facilities),
    ownerId: data.owner_id,
    ownerPhone: data.owner_phone,
    available: data.available,
    createdAt: data.created_at
  };
};
