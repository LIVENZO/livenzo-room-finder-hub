
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { findUserById, createRelationshipRequest } from '@/services/relationship';
import { User, Search, X, CheckCircle, InfoIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useNavigate } from 'react-router-dom';

interface UserSearchProps {
  currentUserId: string;
}

const UserSearch: React.FC<UserSearchProps> = ({ currentUserId }) => {
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<{id: string, full_name: string, avatar_url: string} | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const { isComplete, requireComplete } = useProfileCompletion();
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchId.trim()) {
      toast.error("Please enter a valid owner ID");
      return;
    }
    
    setIsSearching(true);
    setRequestError(null);
    
    try {
      const user = await findUserById(searchId.trim());
      if (user) {
        console.log("Found user:", user);
        setFoundUser(user);
      } else {
        toast.error("Owner not found. Make sure you have the correct ID");
        setRequestError("Owner not found. Double check the ID and try again.");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search for owner");
      setRequestError("Search failed. Please try again later.");
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
        toast.success(`Connection request sent to ${foundUser.full_name || 'owner'}`);
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

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Find an Owner</CardTitle>
        <CardDescription>
          Ask the property owner for their ID and enter it below to connect
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="relative w-full">
            <Input
              type="text"
              placeholder="Enter owner ID"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full pr-8"
            />
            {searchId && (
              <button 
                type="button" 
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={clearSearch}
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            )}
          </div>
          <Button type="submit" disabled={isSearching}>
            {isSearching ? "Searching..." : <Search className="h-4 w-4" />}
          </Button>
        </form>

        {requestError && (
          <div className="p-3 mb-4 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
            <InfoIcon className="h-4 w-4" />
            <span>{requestError}</span>
          </div>
        )}

        {foundUser && (
          <div className="mt-4">
            <div className="flex items-center gap-3 p-3 border rounded-md">
              <Avatar>
                <AvatarImage src={foundUser.avatar_url || ''} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{foundUser.full_name || 'Unknown owner'}</p>
                <p className="text-xs text-gray-500">ID: {foundUser.id}</p>
              </div>
              {requestSent && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
          </div>
        )}
      </CardContent>
      {foundUser && !requestSent && (
        <CardFooter>
          <Button 
            onClick={handleConnect} 
            className="w-full"
          >
            Send Connection Request
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default UserSearch;
