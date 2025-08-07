
import React from 'react';
import Layout from '@/components/Layout';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  isRedirecting: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({ isRedirecting }) => {
  return (
    <Layout hideNav>
      <div className="w-full h-full min-h-screen flex flex-col justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="w-full flex-1 flex flex-col justify-center p-6 space-y-8">
          <div className="space-y-3 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary">Livenzo</h1>
            <p className="text-xl md:text-2xl text-gray-600">
              {isRedirecting ? "Redirecting to dashboard..." : "Loading..."}
            </p>
          </div>
          <div className="w-full bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoadingState;
