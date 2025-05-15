
import { Room } from '@/types/room';

// Re-export all room service functions from separate files
export { fetchRooms } from './roomFetchService';
export { addRoomService } from './roomCreateService';
export { updateRoomService, updateRoomAvailabilityService } from './roomUpdateService';
export { deleteRoomService } from './roomDeleteService';

// Also re-export any utility functions that might be needed elsewhere
export { parseFacilities, mapDbRoomToRoom } from '@/utils/roomUtils';
