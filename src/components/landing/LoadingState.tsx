
import React from 'react';
import Layout from '@/components/Layout';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  isRedirecting: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({ isRedirecting }) => {
  return (
    <Layout hideNav>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
        <div className="max-w-md w-full mx-auto text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-primary">Livenzo</h1>
            <p className="text-xl text-gray-600">
              {isRedirecting ? "Redirecting to dashboard..." : "Loading..."}
            </p>
          </div>
          <div className="bg-white/50 p-8 rounded-xl shadow-lg space-y-6 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoadingState;
