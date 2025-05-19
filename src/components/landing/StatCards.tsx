
import React from 'react';
import { GraduationCap, School, University } from 'lucide-react';

const StatCards: React.FC = () => {
  return (
    <div className="grid grid-cols-3 gap-4 text-center">
      <div className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
        <div className="flex justify-center mb-2">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div className="font-bold text-lg">5,000+</div>
        <div className="text-sm text-gray-500">Student Tenants</div>
      </div>
      <div className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
        <div className="flex justify-center mb-2">
          <University className="h-6 w-6 text-primary" />
        </div>
        <div className="font-bold text-lg">100+</div>
        <div className="text-sm text-gray-500">Universities Covered</div>
      </div>
      <div className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
        <div className="flex justify-center mb-2">
          <School className="h-6 w-6 text-primary" />
        </div>
        <div className="font-bold text-lg">300+</div>
        <div className="text-sm text-gray-500">Student Housing Options</div>
      </div>
    </div>
  );
};

export default StatCards;
