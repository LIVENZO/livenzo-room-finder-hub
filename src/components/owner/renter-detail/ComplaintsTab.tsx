
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Send, Clock, CheckCircle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { fetchComplaintsForRelationship, updateComplaintResponse, updateComplaintStatus, type Complaint } from '@/services/ComplaintService';

interface ComplaintsTabProps {
  relationshipId: string;
}

const ComplaintsTab: React.FC<ComplaintsTabProps> = ({ relationshipId }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseTexts, setResponseTexts] = useState<Record<string, string>>({});
  const [submittingResponse, setSubmittingResponse] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (relationshipId) {
      loadComplaints();
    }
  }, [relationshipId]);

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

  const handleSendResponse = async (complaintId: string) => {
    const responseText = responseTexts[complaintId];
    
    if (!responseText?.trim()) {
      toast.error('Please enter a response');
      return;
    }
    
    setSubmittingResponse(prev => ({ ...prev, [complaintId]: true }));
    
    try {
      const updatedComplaint = await updateComplaintResponse(complaintId, responseText, 'in_progress');
      
      if (updatedComplaint) {
        setResponseTexts(prev => ({ ...prev, [complaintId]: '' }));
        await loadComplaints();
      }
    } catch (error) {
      console.error('Error sending response:', error);
    } finally {
      setSubmittingResponse(prev => ({ ...prev, [complaintId]: false }));
    }
  };

  const handleStatusChange = async (complaintId: string, newStatus: 'pending' | 'in_progress' | 'resolved') => {
    try {
      const updatedComplaint = await updateComplaintStatus(complaintId, newStatus);
      
      if (updatedComplaint) {
        await loadComplaints();
      }
    } catch (error) {
      console.error('Error updating status:', error);
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
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Complaints & Issues
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-8">Loading complaints...</p>
        ) : (
          <div className="space-y-6">
            {complaints.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No complaints have been submitted yet
              </p>
            ) : (
              complaints.map((complaint) => (
                <div key={complaint.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h3 className="font-medium text-base leading-relaxed break-words flex-1">{complaint.title}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <Select 
                        value={complaint.status} 
                        onValueChange={(value: 'pending' | 'in_progress' | 'resolved') => 
                          handleStatusChange(complaint.id, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge variant={getStatusVariant(complaint.status)} className="flex items-center gap-1">
                        {getStatusIcon(complaint.status)}
                        {getStatusLabel(complaint.status)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 leading-relaxed break-words whitespace-pre-wrap p-3 bg-gray-50 rounded mb-3">
                    {complaint.description}
                  </div>
                  
                  <p className="text-xs text-gray-500 mb-4">
                    Submitted on {new Date(complaint.created_at).toLocaleDateString()}
                  </p>
                  
                  {complaint.response && (
                    <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
                      <p className="text-sm font-medium text-green-800 mb-2">Your Response:</p>
                      <div className="text-sm text-green-700 leading-relaxed break-words whitespace-pre-wrap">
                        {complaint.response}
                      </div>
                      <p className="text-xs text-green-600 mt-2">
                        Responded on {new Date(complaint.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  
                  {complaint.status !== 'resolved' && (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Type your response to this complaint..."
                        value={responseTexts[complaint.id] || ''}
                        onChange={(e) => setResponseTexts(prev => ({ 
                          ...prev, 
                          [complaint.id]: e.target.value 
                        }))}
                        className="text-base leading-relaxed resize-none"
                        rows={3}
                      />
                      <Button 
                        onClick={() => handleSendResponse(complaint.id)} 
                        size="sm"
                        disabled={submittingResponse[complaint.id]}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {submittingResponse[complaint.id] ? 'Sending...' : 'Send Response'}
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComplaintsTab;
