
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, User, MapPin, Home, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { findUserById, createRelationshipRequest } from '@/services/relationship';

interface ConnectWithOwnerProps {
  currentUserId: string;
}

const ConnectWithOwner: React.FC<ConnectWithOwnerProps> = ({ currentUserId }) => {
  const [ownerId, setOwnerId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundOwner, setFoundOwner] = useState<{id: string, full_name: string, avatar_url: string} | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ownerId.trim()) {
      toast.error("Please enter an Owner ID");
      return;
    }
    
    setIsSearching(true);
    setError(null);
    setFoundOwner(null);
    
    try {
      const owner = await findUserById(ownerId.trim());
      if (owner) {
        setFoundOwner(owner);
      } else {
        setError("No owner found with this ID");
      }
    } catch (error) {
      console.error("Search error:", error);
      setError("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!foundOwner) return;
    
    try {
      const response = await createRelationshipRequest(foundOwner.id, currentUserId);
      
      if (response) {
        setRequestSent(true);
        toast.success("Request sent successfully. Awaiting approval.");
      } else {
        toast.error("Failed to send request. Please try again.");
      }
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Failed to send connection request");
    }
  };

  const handleReset = () => {
    setOwnerId('');
    setFoundOwner(null);
    setRequestSent(false);
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <Search className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Connect with Your Owner</h1>
        <p className="text-lg text-gray-600">
          Enter your property owner's unique ID to send a connection request
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Owner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="ownerId" className="block text-sm font-medium text-gray-700 mb-2">
                Enter Owner ID
              </label>
              <div className="flex gap-2">
                <Input
                  id="ownerId"
                  type="text"
                  placeholder="e.g., abc123xy or UUID"
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  disabled={requestSent}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={isSearching || !ownerId.trim() || requestSent}
                >
                  {isSearching ? "Searching..." : "Search"}
                </Button>
              </div>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Owner Found */}
          {foundOwner && (
            <div className="mt-6 space-y-4">
              <h3 className="font-medium text-gray-900">Owner Found:</h3>
              
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={foundOwner.avatar_url || ''} />
                    <AvatarFallback>
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div>
                      <h4 className="font-semibold text-lg">{foundOwner.full_name || 'Property Owner'}</h4>
                      <p className="text-sm text-gray-500">Owner ID: {foundOwner.id}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Home className="h-4 w-4" />
                        <span>PG/Hostel Property</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>Property Location</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!requestSent ? (
                  <>
                    <Button 
                      onClick={handleSendRequest}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Send Connection Request
                    </Button>
                    <Button 
                      onClick={handleReset}
                      variant="outline"
                    >
                      Search Again
                    </Button>
                  </>
                ) : (
                  <div className="w-full">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                      <p className="text-green-700 font-medium">
                        ✅ Request sent to {foundOwner.full_name || 'owner'}
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        You will be notified when they accept your request
                      </p>
                    </div>
                    <Button 
                      onClick={handleReset}
                      variant="outline"
                      className="w-full mt-4"
                    >
                      Search for Another Owner
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <h3 className="font-semibold text-gray-900">Need Help?</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Ask your property owner for their unique Owner ID</p>
              <p>• Make sure you have the correct ID (8-digit or UUID format)</p>
              <p>• Contact your owner if you're having trouble connecting</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectWithOwner;
