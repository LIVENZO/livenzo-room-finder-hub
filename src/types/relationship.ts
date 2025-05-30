
export interface Relationship {
  id: string;
  owner_id: string;
  renter_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
  chat_room_id: string;
  archived?: boolean;
  owner?: {
    full_name: string;
    avatar_url: string;
  };
  renter?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string;
}
