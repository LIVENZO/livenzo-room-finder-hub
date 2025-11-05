
import React from 'react';
import { RoomFilters } from '@/types/room';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Filter } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

interface MobileFilterSheetProps {
  showMobileFilters: boolean;
  setShowMobileFilters: React.Dispatch<React.SetStateAction<boolean>>;
  tempFilters: RoomFilters;
  setTempFilters: React.Dispatch<React.SetStateAction<RoomFilters>>;
  resetFilters: () => void;
  applyFilters: () => void;
}

const MobileFilterSheet: React.FC<MobileFilterSheetProps> = ({
  showMobileFilters,
  setShowMobileFilters,
  tempFilters,
  setTempFilters,
  resetFilters,
  applyFilters,
}) => {
  const maxPriceValue = tempFilters.maxPrice || 10000;
  
  return (
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
              min={500}
              max={50000}
              step={500}
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
          
          <div className="space-y-2">
            <Label>Cooling Type</Label>
            <RadioGroup 
              value={tempFilters.coolingType || ''} 
              onValueChange={(value) => 
                setTempFilters({ ...tempFilters, coolingType: value ? value as 'ac' | 'cooler' : undefined })
              }
              className="flex items-center space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ac" id="mobile-ac" />
                <Label htmlFor="mobile-ac">AC Room</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cooler" id="mobile-cooler" />
                <Label htmlFor="mobile-cooler">Cooler Room</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="" id="mobile-any-cooling" />
                <Label htmlFor="mobile-any-cooling">Any</Label>
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
  );
};

export default MobileFilterSheet;
