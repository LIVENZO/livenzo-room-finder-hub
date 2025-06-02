
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileText, MessageSquare, AlertCircle } from 'lucide-react';
import { Relationship } from '@/types/relationship';
import DocumentsTab from './post-connection/DocumentsTab';
import ComplaintsTab from './post-connection/ComplaintsTab';
import RenterDisconnectButton from './RenterDisconnectButton';
import { useNavigate } from 'react-router-dom';
import { useRelationships } from '@/hooks/useRelationships';

interface PostConnectionInterfaceProps {
  relationship: Relationship;
  currentUserId: string;
}

const PostConnectionInterface: React.FC<PostConnectionInterfaceProps> = ({
  relationship,
  currentUserId
}) => {
  const navigate = useNavigate();
  
  // Use the relationship hook to get documents and handlers
  const {
    documents,
    handleDocumentUploaded
  } = useRelationships(currentUserId, false, relationship.id);

  const handleDisconnect = () => {
    // Navigate back to connections page after disconnect
    navigate('/connections');
  };

  const handleDocumentStatusChanged = () => {
    // Refresh documents when status changes
    handleDocumentUploaded();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Connection Status Header */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <CardTitle className="text-xl text-green-800">
                    Connected to Property Owner
                  </CardTitle>
                  <p className="text-sm text-green-600 mt-1">
                    Your rental connection is active
                  </p>
                </div>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 border-green-300">
              Active Connection
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Owner Info */}
          <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-green-200">
            <Avatar className="h-16 w-16 border-2 border-green-200">
              <AvatarImage src={relationship.owner?.avatar_url || ''} />
              <AvatarFallback className="bg-green-100 text-green-800 text-xl">
                {relationship.owner?.full_name?.charAt(0) || 'O'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {relationship.owner?.full_name || 'Property Owner'}
              </h3>
              <p className="text-sm text-gray-600">
                Connected since {new Date(relationship.created_at).toLocaleDateString()}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700 font-medium">Active Connection</span>
              </div>
            </div>
          </div>

          {/* Disconnect Button */}
          <div className="flex justify-center pt-2">
            <RenterDisconnectButton
              relationship={relationship}
              onDisconnect={handleDisconnect}
              className="w-auto"
            />
          </div>
        </CardContent>
      </Card>

      {/* Management Tabs */}
      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="complaints" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Complaints
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6">
          <DocumentsTab 
            currentUserId={currentUserId}
            relationshipId={relationship.id}
            documents={documents}
            onDocumentUploaded={handleDocumentUploaded}
            onDocumentStatusChanged={handleDocumentStatusChanged}
          />
        </TabsContent>

        <TabsContent value="complaints" className="mt-6">
          <ComplaintsTab relationshipId={relationship.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PostConnectionInterface;
