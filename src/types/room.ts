
export interface Room {
  id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  location: string;
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
}

export interface RoomFilters {
  location?: string;
  maxPrice?: number;
  wifi?: boolean;
  bathroom?: boolean;
  gender?: 'male' | 'female';
  roomType?: 'single' | 'sharing';
  coolingType?: 'ac' | 'cooler';
  food?: 'included' | 'not_included';
}
