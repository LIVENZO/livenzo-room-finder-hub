
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User } from 'lucide-react';

interface EmptyStateProps {
  type: 'requests' | 'connected';
}

const EmptyState: React.FC<EmptyStateProps> = ({ type }) => {
  const content = {
    requests: {
      title: 'No pending requests',
      description: 'New connection requests will appear here'
    },
    connected: {
      title: 'No connected renters',
      description: 'Accepted renters will appear here'
    }
  };

  return (
    <Card>
      <CardContent className="py-8 text-center">
        <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {content[type].title}
        </h3>
        <p className="text-gray-600">{content[type].description}</p>
      </CardContent>
    </Card>
  );
};

export default EmptyState;
