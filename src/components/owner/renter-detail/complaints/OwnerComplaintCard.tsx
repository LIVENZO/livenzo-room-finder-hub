
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Clock, CheckCircle, MessageSquare, AlertTriangle, Send } from 'lucide-react';
import { Complaint, updateComplaintResponse, updateComplaintStatus } from '@/services/ComplaintService';
import { toast } from 'sonner';

interface OwnerComplaintCardProps {
  complaint: Complaint;
  onComplaintUpdated: () => void;
}

const OwnerComplaintCard: React.FC<OwnerComplaintCardProps> = ({ 
  complaint, 
  onComplaintUpdated 
}) => {
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <MessageSquare className="h-4 w-4" />;
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
      case 'in_progress':
        return 'secondary' as const;
      case 'resolved':
        return 'default' as const;
      default:
        return 'secondary' as const;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      default:
        return status;
    }
  };

  const handleResponseSubmit = async () => {
    if (!response.trim()) {
      toast.error('Please enter a response');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateComplaintResponse(complaint.id, response);
      setResponse('');
      onComplaintUpdated();
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (newStatus: 'pending' | 'in_progress' | 'resolved') => {
    setIsSubmitting(true);
    try {
      await updateComplaintStatus(complaint.id, newStatus);
      onComplaintUpdated();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{complaint.title}</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Submitted on {new Date(complaint.created_at).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={getStatusVariant(complaint.status)} className="flex items-center gap-1">
            {getStatusIcon(complaint.status)}
            {getStatusLabel(complaint.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-sm whitespace-pre-wrap">{complaint.description}</p>
        </div>

        {complaint.response && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm font-medium text-blue-800 mb-2">Your Response:</p>
            <p className="text-sm text-blue-700 whitespace-pre-wrap">{complaint.response}</p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={complaint.status === 'in_progress' ? 'default' : 'outline'}
              onClick={() => handleStatusUpdate('in_progress')}
              disabled={isSubmitting}
            >
              Mark In Progress
            </Button>
            <Button
              size="sm"
              variant={complaint.status === 'resolved' ? 'default' : 'outline'}
              onClick={() => handleStatusUpdate('resolved')}
              disabled={isSubmitting}
            >
              Mark Resolved
            </Button>
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="Add a response to this complaint..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
            <Button 
              onClick={handleResponseSubmit}
              disabled={isSubmitting || !response.trim()}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Response
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OwnerComplaintCard;
