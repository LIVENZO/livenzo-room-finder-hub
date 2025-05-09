import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useRooms, RoomFilters } from '@/context/RoomContext';
import Layout from '@/components/Layout';
import RoomCard from '@/components/RoomCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, Search } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

const FindRoom: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { filteredRooms, filters, setFilters, isLoading } = useRooms();
  const [tempFilters, setTempFilters] = useState<RoomFilters>(filters);
  const [location, setLocation] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);
  
  const handleSearch = () => {
    setFilters({
      ...filters,
      location,
    });
  };
  
  const applyFilters = () => {
    setFilters(tempFilters);
    setShowMobileFilters(false);
  };
  
  const resetFilters = () => {
    setTempFilters({});
  };
  
  if (!user) return null;
  
  const maxPriceValue = tempFilters.maxPrice || 50000;
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-6">Find Your Perfect Room</h1>
        
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Enter location (city, zip code)"
              className="pr-12"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              size="icon"
              className="absolute right-1 top-1 h-8 w-8"
              onClick={handleSearch}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="block md:hidden">
            <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Narrow down your search with these options.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div className="space-y-2">
                    <Label>Budget (Monthly Rent)</Label>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Max: ₹{maxPriceValue}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTempFilters({ ...tempFilters, maxPrice: undefined })}
                      >
                        Reset
                      </Button>
                    </div>
                    <Slider
                      value={[maxPriceValue]}
                      min={5000}
                      max={100000}
                      step={5000}
                      onValueChange={(values) => setTempFilters({ ...tempFilters, maxPrice: values[0] })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Gender Preference</Label>
                    <Select
                      value={tempFilters.gender || 'any'}
                      onValueChange={(value) =>
                        setTempFilters({
                          ...tempFilters,
                          gender: value === 'any' ? undefined : value as 'male' | 'female',
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="male">Boys only</SelectItem>
                        <SelectItem value="female">Girls only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Room Type</Label>
                    <RadioGroup 
                      value={tempFilters.roomType || ''} 
                      onValueChange={(value) => 
                        setTempFilters({ ...tempFilters, roomType: value ? value as 'single' | 'sharing' : undefined })
                      }
                      className="flex items-center space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="single" id="mobile-single" />
                        <Label htmlFor="mobile-single">Single</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sharing" id="mobile-sharing" />
                        <Label htmlFor="mobile-sharing">Sharing</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="" id="mobile-any-room" />
                        <Label htmlFor="mobile-any-room">Any</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="mobile-wifi"
                      checked={tempFilters.wifi === true}
                      onCheckedChange={(checked) => 
                        setTempFilters({ ...tempFilters, wifi: checked ? true : undefined })
                      }
                    />
                    <Label htmlFor="mobile-wifi">WiFi Available</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="mobile-bathroom"
                      checked={tempFilters.bathroom === true}
                      onCheckedChange={(checked) => 
                        setTempFilters({ ...tempFilters, bathroom: checked ? true : undefined })
                      }
                    />
                    <Label htmlFor="mobile-bathroom">Connected Bathroom</Label>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 mt-8">
                    <Button onClick={resetFilters} variant="outline" className="flex-1">
                      Reset All
                    </Button>
                    <Button onClick={applyFilters} className="flex-1">
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="hidden md:block w-full lg:w-64 space-y-6">
            <div className="bg-white rounded-lg border p-4 shadow-sm">
              <h3 className="text-lg font-medium mb-4">Filters</h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Budget (Monthly Rent)</Label>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Max: ₹{maxPriceValue}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTempFilters({ ...tempFilters, maxPrice: undefined })}
                    >
                      Reset
                    </Button>
                  </div>
                  <Slider
                    value={[maxPriceValue]}
                    min={5000}
                    max={100000}
                    step={5000}
                    onValueChange={(values) => setTempFilters({ ...tempFilters, maxPrice: values[0] })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Gender Preference</Label>
                  <Select
                    value={tempFilters.gender || 'any'}
                    onValueChange={(value) =>
                      setTempFilters({
                        ...tempFilters,
                        gender: value === 'any' ? undefined : value as 'male' | 'female',
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="male">Boys only</SelectItem>
                      <SelectItem value="female">Girls only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Room Type</Label>
                  <RadioGroup 
                    value={tempFilters.roomType || ''} 
                    onValueChange={(value) => 
                      setTempFilters({ ...tempFilters, roomType: value ? value as 'single' | 'sharing' : undefined })
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="single" id="single" />
                      <Label htmlFor="single">Single</Label>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <RadioGroupItem value="sharing" id="sharing" />
                      <Label htmlFor="sharing">Sharing</Label>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <RadioGroupItem value="" id="any-room" />
                      <Label htmlFor="any-room">Any</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="wifi"
                    checked={tempFilters.wifi === true}
                    onCheckedChange={(checked) => 
                      setTempFilters({ ...tempFilters, wifi: checked ? true : undefined })
                    }
                  />
                  <Label htmlFor="wifi">WiFi Available</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="bathroom"
                    checked={tempFilters.bathroom === true}
                    onCheckedChange={(checked) => 
                      setTempFilters({ ...tempFilters, bathroom: checked ? true : undefined })
                    }
                  />
                  <Label htmlFor="bathroom">Connected Bathroom</Label>
                </div>
                
                <div className="flex flex-col gap-2 pt-4">
                  <Button onClick={resetFilters} variant="outline">
                    Reset All
                  </Button>
                  <Button onClick={applyFilters}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            {isLoading ? (
              <div className="text-center py-12">Loading rooms...</div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <h3 className="text-xl font-medium mb-2">No rooms found</h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your filters or search for a different location.
                </p>
                <Button onClick={resetFilters} variant="outline">
                  Reset All Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-4 flex justify-between items-center">
                  <p className="text-gray-600">Showing {filteredRooms.length} results</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRooms.map((room) => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FindRoom;
