
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { submitComplaint } from '@/services/ComplaintService';
import { EnhancedValidator } from '@/services/security/enhancedValidation';
import { securityMonitor } from '@/services/security/securityMonitor';
import { validateAuthentication } from '@/services/security/authValidator';

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

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setComplaintTitle(e.target.value);
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComplaintDescription(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate authentication
    const authResult = await validateAuthentication();
    if (!authResult.isValid) {
      toast.error('Authentication required. Please log in again.');
      return;
    }
    
    // Enhanced validation
    const titleValidation = EnhancedValidator.validateAndSanitize(complaintTitle, 'safeName', {
      required: true,
      minLength: 5,
      maxLength: 100
    });
    
    const descriptionValidation = EnhancedValidator.validateDescription(complaintDescription, true);
    
    if (!titleValidation.isValid) {
      toast.error(titleValidation.error || 'Please provide a valid title');
      return;
    }
    
    if (!descriptionValidation.isValid) {
      toast.error(descriptionValidation.error || 'Please provide a valid description');
      return;
    }

    if (!ownerId) {
      toast.error('Unable to submit complaint. Relationship not found.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Monitor user behavior for security
      await securityMonitor.monitorUserBehavior(authResult.userId!, 'complaint_submission');
      
      const newComplaint = await submitComplaint(
        relationshipId,
        ownerId,
        titleValidation.sanitizedValue!,
        descriptionValidation.sanitizedValue!
      );
      
      if (newComplaint) {
        setComplaintTitle('');
        setComplaintDescription('');
        onComplaintSubmitted();
        toast.success('Complaint submitted successfully');
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      
      // Log potential security issue
      securityMonitor.logSuspiciousActivity('complaint_submission_failure', {
        error: error instanceof Error ? error.message : 'Unknown error',
        relationshipId,
        ownerId
      });
      
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
              onChange={handleTitleChange}
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
              onChange={handleDescriptionChange}
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
