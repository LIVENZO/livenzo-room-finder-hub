
import React from 'react';

const StatCards: React.FC = () => {
  return (
    <div className="grid grid-cols-3 gap-4 text-center">
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="font-bold text-lg">1000+</div>
        <div className="text-sm text-gray-500">Available Rooms</div>
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="font-bold text-lg">500+</div>
        <div className="text-sm text-gray-500">Happy Users</div>
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="font-bold text-lg">50+</div>
        <div className="text-sm text-gray-500">Cities</div>
      </div>
    </div>
  );
};

export default StatCards;
