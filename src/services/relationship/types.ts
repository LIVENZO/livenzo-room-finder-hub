
import { Relationship, UserProfile } from "@/types/relationship";

export interface RelationshipResponse {
  relationship: Relationship;
  renterProfile?: UserProfile;
  ownerProfile?: UserProfile;
}

