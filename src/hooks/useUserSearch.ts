
import { useState } from 'react';
import { findUserById, createRelationshipRequest } from '@/services/relationship';
import { toast } from 'sonner';
import { UserProfile } from '@/types/relationship';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';

export const useUserSearch = (currentUserId: string) => {
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const { requireComplete } = useProfileCompletion();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchId.trim()) {
      toast.error("Please enter a valid Owner ID");
      return;
    }
    
    // Validate input length (should be up to 10 characters for public ID)
    const trimmedId = searchId.trim();
    const normalizedId = trimmedId.toLowerCase();
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
        console.log("Found user:", user);
        setFoundUser(user);
        toast.success("Owner found! Review details below and send connection request.");
      } else {
        setFoundUser(null);
        toast.error("❌ No owner found with this ID. Please check and try again.");
        setRequestError("No owner found with this ID. Please double-check the ID and try again.");
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

  const handleConnect = async () => {
    if (!foundUser) return;
    
    if (!requireComplete()) {
      return;
    }
    
    try {
      console.log("Sending connection request from", currentUserId, "to", foundUser.id);
      const response = await createRelationshipRequest(foundUser.id, currentUserId);
      
      if (response) {
        setRequestSent(true);
        toast.success(`🎉 Request sent to ${foundUser.full_name || 'owner'}. You will be notified once they accept.`);
      } else {
        setRequestError("Failed to send request. You may already have a connection with this owner.");
      }
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Failed to send connection request");
      setRequestError("Connection request failed. Please try again later.");
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
