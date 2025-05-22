
import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Notice } from '@/services/NoticeService';
import { Loader2 } from 'lucide-react';

interface NoticesListProps {
  notices: Notice[];
  isLoading: boolean;
}

const NoticesList: React.FC<NoticesListProps> = ({ notices, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notices.length === 0) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No notices received yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notices.map((notice) => (
        <Card key={notice.id} className="shadow-sm hover:shadow transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base font-medium">Notice from Owner</CardTitle>
              <span className="text-xs text-gray-500">
                {format(new Date(notice.created_at), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{notice.message}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default NoticesList;
