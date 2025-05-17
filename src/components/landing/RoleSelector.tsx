
import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface RoleSelectorProps {
  userRole: string;
  setUserRole: (role: string) => void;
  canChangeRole: boolean;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ 
  userRole, 
  setUserRole, 
  canChangeRole 
}) => {
  return (
    <div className="space-y-4">
      <p className="font-medium text-gray-700">I am a:</p>
      <RadioGroup 
        value={userRole} 
        onValueChange={setUserRole} 
        className="flex flex-col space-y-2"
        disabled={!canChangeRole}
      >
        <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-gray-50">
          <RadioGroupItem value="owner" id="owner" />
          <label htmlFor="owner" className="w-full cursor-pointer">Property Owner</label>
        </div>
        <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-gray-50">
          <RadioGroupItem value="renter" id="renter" />
          <label htmlFor="renter" className="w-full cursor-pointer">Renter</label>
        </div>
      </RadioGroup>
      
      {!canChangeRole && (
        <div className="text-amber-600 text-sm mt-2 bg-amber-50 p-2 rounded-md">
          Your role is locked to your Google account. To change roles, please sign in with a different Google account.
        </div>
      )}
    </div>
  );
};

export default RoleSelector;
