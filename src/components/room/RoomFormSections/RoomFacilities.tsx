
import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RoomFacilitiesProps {
  gender: 'any' | 'male' | 'female';
  setGender: React.Dispatch<React.SetStateAction<'any' | 'male' | 'female'>>;
  roomType: 'single' | 'sharing';
  setRoomType: React.Dispatch<React.SetStateAction<'single' | 'sharing'>>;
  wifi: boolean;
  setWifi: React.Dispatch<React.SetStateAction<boolean>>;
  bathroom: boolean;
  setBathroom: React.Dispatch<React.SetStateAction<boolean>>;
}

const RoomFacilities: React.FC<RoomFacilitiesProps> = ({
  gender,
  setGender,
  roomType,
  setRoomType,
  wifi,
  setWifi,
  bathroom,
  setBathroom
}) => {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Facilities</h3>
      
      <div className="space-y-2">
        <Label htmlFor="gender" className="text-sm">Gender Preference</Label>
        <Select 
          value={gender}
          onValueChange={(value: 'any' | 'male' | 'female') => setGender(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Gender</SelectItem>
            <SelectItem value="male">Boys Only</SelectItem>
            <SelectItem value="female">Girls Only</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label className="text-sm">Room Type</Label>
        <RadioGroup
          value={roomType}
          onValueChange={(value: 'single' | 'sharing') => setRoomType(value)}
          className="flex flex-col space-y-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="single" id="list-single" />
            <Label htmlFor="list-single">Single Room</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sharing" id="list-sharing" />
            <Label htmlFor="list-sharing">Sharing Room</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="wifi-switch" className="cursor-pointer">WiFi Included</Label>
        <Switch
          id="wifi-switch"
          checked={wifi}
          onCheckedChange={setWifi}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="bathroom-switch" className="cursor-pointer">Connected Bathroom</Label>
        <Switch
          id="bathroom-switch"
          checked={bathroom}
          onCheckedChange={setBathroom}
        />
      </div>
    </div>
  );
};

export default RoomFacilities;
