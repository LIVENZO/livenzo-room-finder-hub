
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { submitComplaint } from '@/services/ComplaintService';

interface ComplaintFormProps {
  relationshipId: string;
  ownerId: string;
  onComplaintSubmitted: () => void;
}

const ComplaintForm: React.FC<ComplaintFormProps> = ({
  relationshipId,
  ownerId,
  onComplaintSubmitted,
}) => {
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!complaintTitle.trim() || !complaintDescription.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!ownerId) {
      toast.error('Unable to submit complaint. Relationship not found.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const newComplaint = await submitComplaint(
        relationshipId,
        ownerId,
        complaintTitle,
        complaintDescription
      );
      
      if (newComplaint) {
        setComplaintTitle('');
        setComplaintDescription('');
        onComplaintSubmitted();
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error('Failed to submit complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
              className="text-base leading-relaxed"
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
              className="text-base leading-relaxed resize-none"
            />
          </div>
          
          <Button type="submit" disabled={isSubmitting} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ComplaintForm;
