
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  FileText, 
  AlertTriangle, 
  DollarSign, 
  StickyNote,
  MessageSquare,
  Send
} from 'lucide-react';
import { Relationship } from '@/types/relationship';
import { Document, fetchDocumentsForRelationship } from '@/services/DocumentService';
import { toast } from 'sonner';

interface RenterDetailPanelProps {
  relationship: Relationship;
  onBack: () => void;
  onRefresh: () => void;
}

const RenterDetailPanel: React.FC<RenterDetailPanelProps> = ({
  relationship,
  onBack,
  onRefresh,
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseText, setResponseText] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadDocuments();
  }, [relationship.id]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await fetchDocumentsForRelationship(relationship.id);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResponse = () => {
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }
    
    // TODO: Implement complaint response functionality
    toast.success('Response sent successfully');
    setResponseText('');
  };

  const handleSaveNotes = () => {
    // TODO: Implement notes saving functionality
    toast.success('Notes saved successfully');
  };

  // Mock data for payments and complaints - replace with real data
  const mockPayments = [
    { id: '1', amount: 1200, date: '2024-01-01', status: 'Paid', transactionId: 'TXN001' },
    { id: '2', amount: 1200, date: '2024-02-01', status: 'Pending', transactionId: null },
  ];

  const mockComplaints = [
    { id: '1', title: 'Leaky faucet', status: 'Pending', date: '2024-01-15', description: 'The kitchen faucet is leaking constantly.' },
    { id: '2', title: 'Noisy neighbors', status: 'Resolved', date: '2024-01-10', description: 'Late night noise from upstairs.' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Renters
        </Button>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={relationship.renter?.avatar_url || ''} />
            <AvatarFallback className="text-xl">
              {relationship.renter?.full_name?.charAt(0) || 'R'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">
              {relationship.renter?.full_name || 'Unknown Renter'}
            </h1>
            <p className="text-gray-500">
              Connected since {new Date(relationship.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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
                <Button variant="outline" className="h-20 flex-col">
                  <MessageSquare className="h-6 w-6 mb-2" />
                  Chat
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  Documents
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <DollarSign className="h-6 w-6 mb-2" />
                  Payments
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <AlertTriangle className="h-6 w-6 mb-2" />
                  Complaints
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Uploaded Documents ({documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading documents...</p>
              ) : documents.length === 0 ? (
                <p className="text-gray-500">No documents uploaded yet.</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{doc.file_name}</p>
                        <p className="text-sm text-gray-500">
                          {doc.document_type} • Uploaded {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={doc.status === 'approved' ? 'default' : doc.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {doc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complaints" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Rent Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">${payment.amount}</p>
                      <p className="text-sm text-gray-500">
                        Due: {payment.date}
                        {payment.transactionId && ` • ID: ${payment.transactionId}`}
                      </p>
                    </div>
                    <Badge variant={payment.status === 'Paid' ? 'default' : 'destructive'}>
                      {payment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StickyNote className="h-5 w-5" />
                Internal Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Add private notes about this renter (only visible to you)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
              />
              <Button onClick={handleSaveNotes}>
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RenterDetailPanel;
