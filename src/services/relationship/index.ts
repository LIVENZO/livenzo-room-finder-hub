
// Re-export types from types folder
export type { Relationship, UserProfile } from "@/types/relationship";

// Re-export all functions
export { 
  fetchRelationship 
} from "./fetchSingleRelationship";

export {
  fetchOwnerRelationships 
} from "./fetchOwnerRelationships";

export {
  fetchRenterRelationships 
} from "./fetchRenterRelationships";

export {
  createRelationshipRequest,
  updateRelationshipStatus
} from "./manageRelationships";

export { findUserById } from "./userService";
