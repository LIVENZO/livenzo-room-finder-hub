
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { findUserById, createRelationshipRequest } from '@/services/RelationshipService';
import { User, Search, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserSearchProps {
  currentUserId: string;
}

const UserSearch: React.FC<UserSearchProps> = ({ currentUserId }) => {
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<{id: string, full_name: string, avatar_url: string} | null>(null);
  const [requestSent, setRequestSent] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchId.trim()) {
      toast.error("Please enter a valid owner ID");
      return;
    }
    
    setIsSearching(true);
    
    try {
      const user = await findUserById(searchId.trim());
      if (user) {
        setFoundUser(user);
      } else {
        toast.error("Owner not found. Make sure you have the correct ID");
      }
    } catch (error) {
      toast.error("Failed to search for owner");
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConnect = async () => {
    if (!foundUser) return;
    
    try {
      await createRelationshipRequest(foundUser.id, currentUserId);
      setRequestSent(true);
      toast.success(`Connection request sent to ${foundUser.full_name || 'owner'}`);
    } catch (error) {
      console.error("Error connecting with user:", error);
      toast.error("Failed to send connection request");
    }
  };

  const clearSearch = () => {
    setFoundUser(null);
    setSearchId('');
    setRequestSent(false);
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
                <p className="text-xs text-gray-500">{foundUser.id}</p>
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
