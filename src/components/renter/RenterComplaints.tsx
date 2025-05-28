
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Send, Clock, CheckCircle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { submitComplaint, fetchComplaintsForRelationship, type Complaint } from '@/services/ComplaintService';
import { supabase } from '@/integrations/supabase/client';

interface RenterComplaintsProps {
  relationshipId: string;
}

const RenterComplaints: React.FC<RenterComplaintsProps> = ({ relationshipId }) => {
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerId, setOwnerId] = useState<string>('');

  useEffect(() => {
    loadComplaints();
    fetchRelationshipDetails();
  }, [relationshipId]);

  const fetchRelationshipDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('relationships')
        .select('owner_id')
        .eq('id', relationshipId)
        .single();

      if (error) {
        console.error('Error fetching relationship:', error);
        return;
      }

      setOwnerId(data.owner_id);
    } catch (error) {
      console.error('Exception fetching relationship:', error);
    }
  };

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const complaintsData = await fetchComplaintsForRelationship(relationshipId);
      setComplaints(complaintsData);
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setLoading(false);
    }
  };

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
        await loadComplaints();
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error('Failed to submit complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4">
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

      {/* Previous Complaints */}
      <Card>
        <CardHeader>
          <CardTitle>Your Complaints</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8">Loading complaints...</p>
          ) : (
            <div className="space-y-4">
              {complaints.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No complaints submitted yet
                </p>
              ) : (
                complaints.map((complaint) => (
                  <div key={complaint.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-medium text-base leading-relaxed break-words flex-1">{complaint.title}</h3>
                      <Badge variant={getStatusVariant(complaint.status)} className="flex items-center gap-1 shrink-0">
                        {getStatusIcon(complaint.status)}
                        {getStatusLabel(complaint.status)}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 leading-relaxed break-words whitespace-pre-wrap p-3 bg-gray-50 rounded">
                      {complaint.description}
                    </div>
                    
                    {complaint.response && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-sm font-medium text-blue-800 mb-2">Owner Response:</p>
                        <div className="text-sm text-blue-700 leading-relaxed break-words whitespace-pre-wrap">
                          {complaint.response}
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      Submitted on {new Date(complaint.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RenterComplaints;
