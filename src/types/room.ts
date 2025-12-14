
export interface Room {
  id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  location: string;
  latitude?: number;
  longitude?: number;
  facilities: {
    wifi?: boolean;
    bathroom?: boolean;
    gender?: 'male' | 'female' | 'any';
    roomType?: 'single' | 'sharing';
    coolingType?: 'ac' | 'cooler';
    food?: 'included' | 'not_included';
  };
  ownerId: string;
  ownerPhone: string;
  available?: boolean;
  createdAt?: string;
  house_no?: string;
  house_name?: string;
  distance?: number; // Distance from search location in km
}

export interface SearchLocation {
  latitude: number;
  longitude: number;
  label?: string;
  radius?: number; // Search radius in km
  searchType: 'city' | 'landmark' | 'near_me'; // Type of search to determine filtering logic
  cityName?: string; // For city-based filtering
}

export interface RoomFilters {
  location?: string;
  searchLocation?: SearchLocation;
  maxPrice?: number;
  wifi?: boolean;
  bathroom?: boolean;
  gender?: 'male' | 'female';
  roomType?: 'single' | 'sharing';
  coolingType?: 'ac' | 'cooler';
  food?: 'included' | 'not_included';
}
