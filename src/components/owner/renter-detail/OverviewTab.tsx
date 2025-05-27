
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  AlertTriangle, 
  DollarSign,
  MessageSquare
} from 'lucide-react';

interface OverviewTabProps {
  onTabChange: (tab: string) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ onTabChange }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Room Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Room --</p>
            <p className="text-sm text-gray-500">Not assigned</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="destructive">1 Pending</Badge>
            <p className="text-sm text-gray-500 mt-1">$1,200 due</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Open Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">1 Pending</Badge>
            <p className="text-sm text-gray-500 mt-1">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col" onClick={() => onTabChange('documents')}>
              <MessageSquare className="h-6 w-6 mb-2" />
              Chat
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => onTabChange('documents')}>
              <FileText className="h-6 w-6 mb-2" />
              Documents
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => onTabChange('payments')}>
              <DollarSign className="h-6 w-6 mb-2" />
              Payments
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => onTabChange('complaints')}>
              <AlertTriangle className="h-6 w-6 mb-2" />
              Complaints
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTab;
