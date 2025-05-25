
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { findUserById, createRelationshipRequest } from '@/services/relationship';
import { User, Search, X, CheckCircle, AlertCircle, MapPin, Home, Building } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';

interface UserSearchProps {
  currentUserId: string;
}

const UserSearch: React.FC<UserSearchProps> = ({ currentUserId }) => {
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<{id: string, full_name: string, avatar_url: string} | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const { requireComplete } = useProfileCompletion();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchId.trim()) {
      toast.error("Please enter a valid Owner ID");
      return;
    }
    
    setIsSearching(true);
    setRequestError(null);
    
    try {
      const user = await findUserById(searchId.trim());
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

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Enter Owner ID (e.g., abc123xy or UUID)"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="w-full pr-10 h-12 text-base border-2 border-gray-200 focus:border-blue-500"
          />
          {searchId && (
            <button 
              type="button" 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button 
          type="submit" 
          disabled={isSearching || !searchId.trim()}
          className="h-12 px-6 bg-blue-600 hover:bg-blue-700"
        >
          {isSearching ? (
            <>
              <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
              Searching...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Search
            </>
          )}
        </Button>
      </form>

      {/* Error Message */}
      {requestError && !foundUser && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">{requestError}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {foundUser && (
        <Card className={`border-2 transition-all ${requestSent ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {requestSent ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-800">Connection Request Sent</span>
                  </>
                ) : (
                  <>
                    <User className="h-5 w-5 text-blue-600" />
                    <span className="text-blue-800">Owner Found</span>
                  </>
                )}
              </CardTitle>
              {requestSent && (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  Request Sent
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Owner Details */}
            <div className="flex items-start gap-4 p-4 bg-white rounded-lg border">
              <Avatar className="h-16 w-16 border-2 border-gray-200">
                <AvatarImage src={foundUser.avatar_url || ''} />
                <AvatarFallback className="text-lg">
                  {foundUser.full_name?.charAt(0) || 'O'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {foundUser.full_name || 'Property Owner'}
                  </h3>
                  <p className="text-sm text-gray-500">Owner ID: {foundUser.id}</p>
                </div>
                
                {/* Property Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Building className="h-4 w-4 text-blue-500" />
                    <span>PG/Hostel Property</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Home className="h-4 w-4 text-green-500" />
                    <span>Rental Rooms Available</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    <span>Property Location</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-700 font-medium">Available for Connection</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {requestSent && (
              <div className="p-4 bg-green-100 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <p className="font-medium">
                    🎉 Request sent to {foundUser.full_name || 'owner'}. You will be notified once they accept.
                  </p>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  Check your notifications for updates on your connection request.
                </p>
              </div>
            )}
          </CardContent>
          
          {/* Action Button */}
          {!requestSent && (
            <CardFooter className="pt-0">
              <Button 
                onClick={handleConnect} 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base font-medium"
              >
                ✅ Send Connection Request
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
};

export default UserSearch;
