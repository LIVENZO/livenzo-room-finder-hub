
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Send } from 'lucide-react';
import { toast } from 'sonner';

const ComplaintsTab: React.FC = () => {
  const [responseText, setResponseText] = useState('');

  const handleSendResponse = () => {
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }
    
    // TODO: Implement complaint response functionality
    toast.success('Response sent successfully');
    setResponseText('');
  };

  // Mock data for complaints - replace with real data
  const mockComplaints = [
    { id: '1', title: 'Leaky faucet', status: 'Pending', date: '2024-01-15', description: 'The kitchen faucet is leaking constantly.' },
    { id: '2', title: 'Noisy neighbors', status: 'Resolved', date: '2024-01-10', description: 'Late night noise from upstairs.' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Complaints & Issues
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockComplaints.map((complaint) => (
            <div key={complaint.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{complaint.title}</h3>
                <Badge variant={complaint.status === 'Resolved' ? 'default' : 'destructive'}>
                  {complaint.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">{complaint.description}</p>
              <p className="text-xs text-gray-500">Submitted on {complaint.date}</p>
              
              {complaint.status === 'Pending' && (
                <div className="mt-4 space-y-3">
                  <Textarea
                    placeholder="Type your response to this complaint..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                  />
                  <Button onClick={handleSendResponse} size="sm">
                    <Send className="h-4 w-4 mr-2" />
                    Send Response
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplaintsTab;
