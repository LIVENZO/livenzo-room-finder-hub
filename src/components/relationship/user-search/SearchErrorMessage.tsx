
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface SearchErrorMessageProps {
  error: string;
}

const SearchErrorMessage: React.FC<SearchErrorMessageProps> = ({ error }) => {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">{error}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchErrorMessage;
