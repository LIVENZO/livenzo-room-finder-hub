
import { Room } from '@/types/room';

// Re-export room fetch service only
export { fetchRooms } from './roomFetchService';

// Also re-export any utility functions that might be needed elsewhere
export { parseFacilities, mapDbRoomToRoom } from '@/utils/roomUtils';
