
// Re-export types from types folder
export type { Relationship, UserProfile } from "@/types/relationship";

// Re-export all functions
export { 
  fetchRelationship,
  fetchOwnerRelationships,
  fetchRenterRelationships 
} from "./fetchRelationships";

export {
  createRelationshipRequest,
  updateRelationshipStatus
} from "./manageRelationships";

export { findUserById } from "./userService";
