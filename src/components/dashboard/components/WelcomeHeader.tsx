import React from 'react';
import { Home } from 'lucide-react';
const WelcomeHeader: React.FC = () => {
  return <div className="text-center py-8">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 animate-float">
          <Home className="h-8 w-8 text-white" />
        </div>
        
        
      </div>
    </div>;
};
export default WelcomeHeader;