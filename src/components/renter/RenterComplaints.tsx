
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Send, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RenterComplaintsProps {
  relationshipId: string;
}

const RenterComplaints: React.FC<RenterComplaintsProps> = ({ relationshipId }) => {
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data for now - replace with real data later
  const [complaints] = useState([
    {
      id: '1',
      title: 'Leaky faucet in bathroom',
      description: 'The bathroom faucet has been leaking for 3 days',
      status: 'pending',
      created_at: '2024-01-15',
      response: null
    },
    {
      id: '2',
      title: 'AC not working',
      description: 'Air conditioning unit stopped working yesterday',
      status: 'resolved',
      created_at: '2024-01-10',
      response: 'Technician will visit tomorrow to fix the AC unit.'
    }
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!complaintTitle.trim() || !complaintDescription.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // TODO: Implement actual complaint submission
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock API call
      
      toast.success('Complaint submitted successfully');
      setComplaintTitle('');
      setComplaintDescription('');
    } catch (error) {
      toast.error('Failed to submit complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'destructive' as const;
      case 'resolved':
        return 'default' as const;
      default:
        return 'secondary' as const;
    }
  };

  return (
    <div className="space-y-6">
      {/* Submit New Complaint */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Submit a Complaint
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Complaint Title</Label>
              <Input
                id="title"
                value={complaintTitle}
                onChange={(e) => setComplaintTitle(e.target.value)}
                placeholder="Brief description of the issue"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={complaintDescription}
                onChange={(e) => setComplaintDescription(e.target.value)}
                placeholder="Provide detailed information about the issue..."
                rows={4}
                disabled={isSubmitting}
              />
            </div>
            
            <Button type="submit" disabled={isSubmitting} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Previous Complaints */}
      <Card>
        <CardHeader>
          <CardTitle>Your Complaints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complaints.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No complaints submitted yet
              </p>
            ) : (
              complaints.map((complaint) => (
                <div key={complaint.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{complaint.title}</h3>
                    <Badge variant={getStatusVariant(complaint.status)} className="flex items-center gap-1">
                      {getStatusIcon(complaint.status)}
                      {complaint.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600">{complaint.description}</p>
                  
                  {complaint.response && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-sm font-medium text-blue-800 mb-1">Owner Response:</p>
                      <p className="text-sm text-blue-700">{complaint.response}</p>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    Submitted on {new Date(complaint.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RenterComplaints;
