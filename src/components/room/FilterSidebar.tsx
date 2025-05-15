
import React from 'react';
import { RoomFilters } from '@/types/room';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
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

interface FilterSidebarProps {
  tempFilters: RoomFilters;
  setTempFilters: React.Dispatch<React.SetStateAction<RoomFilters>>;
  resetFilters: () => void;
  applyFilters: () => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ 
  tempFilters, 
  setTempFilters, 
  resetFilters, 
  applyFilters 
}) => {
  const maxPriceValue = tempFilters.maxPrice || 50000;

  return (
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
  );
};

export default FilterSidebar;
