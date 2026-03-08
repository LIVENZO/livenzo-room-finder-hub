
export interface Room {
  id: string;
  title: string;
  description: string;
  images: string[];
  videos?: string[]; // Room video tour URLs (max 2 videos)
  price: number;
  maximum_price?: number | null;
  minimum_price?: number | null;
  location: string;
  latitude?: number;
  longitude?: number;
  facilities: {
    wifi?: boolean;
    bathroom?: boolean;
    laundry?: boolean;
    electricBill?: boolean;
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
  is_top_room?: boolean;
}

export interface SearchLocation {
  latitude: number;
  longitude: number;
  label?: string;
  radius?: number; // Search radius in km
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
