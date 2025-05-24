
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserProfile } from '@/services/UserProfileService';

interface OwnerPropertyFormProps {
  formValues: {
    accommodationType: string;
    propertyName: string;
    houseNumber: string;
    totalRentalRooms: string;
    residentType: string;
    propertyLocation: string;
  };
  profile: UserProfile | null;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (field: string, value: string) => void;
}

const OwnerPropertyForm: React.FC<OwnerPropertyFormProps> = ({ 
  formValues, 
  profile, 
  onInputChange, 
  onSelectChange 
}) => {
  return (
    <div className="w-full space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
      
      <div className="grid gap-2">
        <Label htmlFor="accommodationType">Type of Accommodation <span className="text-red-500">*</span></Label>
        <Select 
          value={formValues.accommodationType} 
          onValueChange={(value) => onSelectChange('accommodationType', value)}
        >
          <SelectTrigger className={!formValues.accommodationType ? "border-red-300" : ""}>
            <SelectValue placeholder="Select accommodation type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PG">PG</SelectItem>
            <SelectItem value="Hostel">Hostel</SelectItem>
          </SelectContent>
        </Select>
        {!formValues.accommodationType && (
          <p className="text-xs text-red-500">Accommodation type is required</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="propertyName">Name of PG/Hostel <span className="text-red-500">*</span></Label>
        <Input
          id="propertyName"
          name="propertyName"
          value={formValues.propertyName}
          onChange={onInputChange}
          placeholder="Enter property name"
          className={!formValues.propertyName ? "border-red-300" : ""}
          required
        />
        {!formValues.propertyName && (
          <p className="text-xs text-red-500">Property name is required</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="houseNumber">House Number <span className="text-red-500">*</span></Label>
        <Input
          id="houseNumber"
          name="houseNumber"
          value={formValues.houseNumber}
          onChange={onInputChange}
          placeholder="Enter house number"
          className={!formValues.houseNumber ? "border-red-300" : ""}
          required
        />
        {!formValues.houseNumber && (
          <p className="text-xs text-red-500">House number is required</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="totalRentalRooms">Total Number of Rental Rooms <span className="text-red-500">*</span></Label>
        <Input
          id="totalRentalRooms"
          name="totalRentalRooms"
          type="number"
          min="1"
          value={formValues.totalRentalRooms}
          onChange={onInputChange}
          placeholder="Enter number of rooms"
          className={!formValues.totalRentalRooms || parseInt(formValues.totalRentalRooms) < 1 ? "border-red-300" : ""}
          required
        />
        {(!formValues.totalRentalRooms || parseInt(formValues.totalRentalRooms) < 1) && (
          <p className="text-xs text-red-500">Valid number of rooms is required</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="residentType">Resident Type <span className="text-red-500">*</span></Label>
        <Select 
          value={formValues.residentType} 
          onValueChange={(value) => onSelectChange('residentType', value)}
        >
          <SelectTrigger className={!formValues.residentType ? "border-red-300" : ""}>
            <SelectValue placeholder="Select resident type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Boys">Boys</SelectItem>
            <SelectItem value="Girls">Girls</SelectItem>
            <SelectItem value="Both">Both</SelectItem>
          </SelectContent>
        </Select>
        {!formValues.residentType && (
          <p className="text-xs text-red-500">Resident type is required</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="propertyLocation">Location of the Property <span className="text-red-500">*</span></Label>
        <Input
          id="propertyLocation"
          name="propertyLocation"
          value={formValues.propertyLocation}
          onChange={onInputChange}
          placeholder="Enter property location/address"
          className={!formValues.propertyLocation ? "border-red-300" : ""}
          required
        />
        {!formValues.propertyLocation && (
          <p className="text-xs text-red-500">Property location is required</p>
        )}
      </div>
    </div>
  );
};

export default OwnerPropertyForm;
