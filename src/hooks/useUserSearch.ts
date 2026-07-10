import { useState } from 'react';
import { findUserById, createRelationshipRequest } from '@/services/relationship';
import type { FoundConnectionTarget } from '@/services/relationship/userService';
import { toast } from 'sonner';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useAuth } from '@/context/auth';
import { sendCollaborationRequest } from '@/services/collaborationService';

export const useUserSearch = (currentUserId: string) => {
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<FoundConnectionTarget | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const { requireComplete } = useProfileCompletion();
  const { isOwner } = useAuth();

  const runSearch = async (rawId: string) => {
    if (!rawId.trim()) {
      toast.error("Please enter a valid Owner ID");
      return;
    }
    const normalizedId = rawId.trim().toLowerCase();
    if (normalizedId.length < 3) {
      toast.error("Owner ID must be at least 3 characters");
      return;
    }
    if (normalizedId.length > 10) {
      toast.error("Owner ID cannot be more than 10 characters");
      return;
    }

    setIsSearching(true);
    setRequestError(null);

    try {
      const user = await findUserById(normalizedId);
      if (user) {
        setFoundUser(user);
        toast.success(
          isOwner
            ? "Property found! Send collaboration request below."
            : "Owner found! Review details below and send connection request."
        );
      } else {
        setFoundUser(null);
        toast.error("❌ No property found with this ID. Please check and try again.");
        setRequestError("No property found with this ID. Please double-check the ID and try again.");
      }
    } catch (error) {
      console.error("Search error:", error);
      setFoundUser(null);
      toast.error("❌ Search failed. Please try again.");
      setRequestError("Search failed. Please check your internet connection and try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await runSearch(searchId);
  };

  const searchByOwnerId = async (id: string) => {
    setSearchId(id);
    await runSearch(id);
  };

  const handleConnect = async () => {
    if (!foundUser) return;
    
    if (!requireComplete()) {
      return;
    }
    
    try {
      // Owner-to-owner: send a collaboration request scoped to the property's public_id
      if (isOwner) {
        if (!foundUser.public_id) {
          toast.error("Property ID missing — cannot send collaboration request.");
          return;
        }
        await sendCollaborationRequest(foundUser.public_id);
        setRequestSent(true);
        toast.success(`🎉 Collaboration request sent. The property owner will review your request.`);
        return;
      }

      // Renter → owner connection (unchanged)
      const response = await createRelationshipRequest(foundUser.id, currentUserId, foundUser.property_id ?? null);
      if (response) {
        setRequestSent(true);
        toast.success(`🎉 Request sent to ${foundUser.full_name || 'owner'}. You will be notified once they accept.`);
      } else {
        setRequestError("Failed to send request. You may already have a connection with this owner.");
      }
    } catch (error: any) {
      console.error("Connection error:", error);
      const msg = error?.message || "Connection request failed. Please try again later.";
      toast.error(msg);
      setRequestError(msg);
    }
  };

  const clearSearch = () => {
    setFoundUser(null);
    setSearchId('');
    setRequestSent(false);
    setRequestError(null);
  };

  const searchAnother = () => {
    clearSearch();
  };

  return {
    searchId,
    setSearchId,
    isSearching,
    foundUser,
    requestSent,
    requestError,
    handleSearch,
    handleConnect,
    clearSearch,
    searchAnother
  };
};
