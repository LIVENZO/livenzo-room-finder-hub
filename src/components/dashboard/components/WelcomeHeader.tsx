
import React from 'react';
import { Home } from 'lucide-react';

const WelcomeHeader: React.FC = () => {
  return (
    <div className="text-center py-8">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 animate-float">
          <Home className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
          Property Owner Dashboard
        </h1>
        <p className="text-lg text-gray-600 w-full">
          Manage your properties, connect with renters, and grow your rental business with ease.
        </p>
      </div>
    </div>
  );
};

export default WelcomeHeader;
