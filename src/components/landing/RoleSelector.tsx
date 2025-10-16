import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Home, User } from 'lucide-react';
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
  return <div className="space-y-6">
      <div className="text-center">
        
        
      </div>
      
      <RadioGroup value={userRole} onValueChange={setUserRole} className="flex flex-col space-y-4" disabled={!canChangeRole}>
        {/* Property Owner Option */}
        <div className="relative group animate-pulse-scale-owner">
          <input type="radio" value="owner" id="owner" className="sr-only peer" checked={userRole === 'owner'} onChange={() => setUserRole('owner')} disabled={!canChangeRole} />
          <label htmlFor="owner" className="block w-full p-6 bg-gray-100 border-2 border-gray-200 rounded-xl cursor-pointer transition-all duration-300 ease-in-out hover:shadow-medium hover:border-primary-300 peer-checked:bg-primary peer-checked:border-primary-500 peer-checked:shadow-large group-hover:scale-[1.02]">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 p-3 bg-gray-200 rounded-lg peer-checked:bg-white/20 transition-colors duration-300">
                <Home className="w-6 h-6 text-black peer-checked:text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold text-black peer-checked:text-white transition-colors duration-300">Hostel/Pg Owner</h3>
                
              </div>
              <div className="flex-shrink-0">
                <RadioGroupItem value="owner" className="border-gray-400 text-black data-[state=checked]:bg-white data-[state=checked]:text-primary" />
              </div>
            </div>
          </label>
        </div>

        {/* Renter Option */}
        <div className="relative group animate-pulse-scale-renter">
          <input type="radio" value="renter" id="renter" className="sr-only peer" checked={userRole === 'renter'} onChange={() => setUserRole('renter')} disabled={!canChangeRole} />
          <label htmlFor="renter" className="block w-full p-6 bg-gray-100 border-2 border-gray-200 rounded-xl cursor-pointer transition-all duration-300 ease-in-out hover:shadow-medium hover:border-primary-300 peer-checked:bg-primary peer-checked:border-primary-500 peer-checked:shadow-large group-hover:scale-[1.02]">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 p-3 bg-gray-200 rounded-lg peer-checked:bg-white/20 transition-colors duration-300">
                <User className="w-6 h-6 text-black peer-checked:text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold text-black peer-checked:text-white transition-colors duration-300">
                  Renter
                </h3>
                
              </div>
              <div className="flex-shrink-0">
                <RadioGroupItem value="renter" className="border-gray-400 text-black data-[state=checked]:bg-white data-[state=checked]:text-primary" />
              </div>
            </div>
          </label>
        </div>
      </RadioGroup>
      
      {!canChangeRole && <div className="bg-accent-100 border border-accent-300 text-accent-700 text-sm p-4 rounded-lg animate-fade-in">
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Role Locked</p>
              <p className="mt-1">Your role is connected to your account. Sign in with a different account to change roles.</p>
            </div>
          </div>
        </div>}
    </div>;
};
export default RoleSelector;