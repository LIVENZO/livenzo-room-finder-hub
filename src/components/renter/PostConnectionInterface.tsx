
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  AlertTriangle, 
  DollarSign,
  Phone,
  Home,
  MapPin
} from 'lucide-react';
import { Relationship } from '@/types/relationship';
import DocumentUpload from '@/components/document/DocumentUpload';
import DocumentList from '@/components/document/DocumentList';
import RenterComplaints from '@/components/renter/RenterComplaints';
import RenterPayments from '@/components/renter/RenterPayments';
import { fetchDocumentsForRelationship, type Document } from '@/services/DocumentService';
import { fetchOwnerProfileForRenter } from '@/services/OwnerProfileService';
import { UserProfile } from '@/services/UserProfileService';

interface PostConnectionInterfaceProps {
  relationship: Relationship;
  currentUserId: string;
}

const PostConnectionInterface: React.FC<PostConnectionInterfaceProps> = ({
  relationship,
  currentUserId
}) => {
  const [activeTab, setActiveTab] = useState('documents');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const owner = relationship.owner;

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await fetchDocumentsForRelationship(relationship.id);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOwnerProfile = async () => {
    try {
      setProfileLoading(true);
      if (relationship.owner_id) {
        const profile = await fetchOwnerProfileForRenter(relationship.owner_id, currentUserId);
        setOwnerProfile(profile);
      }
    } catch (error) {
      console.error('Error loading owner profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    loadOwnerProfile();
  }, [relationship.id, relationship.owner_id, currentUserId]);

  const handleDocumentUploaded = async () => {
    await loadDocuments();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Owner Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={owner?.avatar_url || ''} />
              <AvatarFallback>
                <Home className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold">
                {owner?.full_name || 'Property Owner'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Home className="h-4 w-4" />
                  <span>
                    {profileLoading ? 'Loading...' : (ownerProfile?.property_name || 'PG/Hostel Name')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {profileLoading ? 'Loading...' : (ownerProfile?.house_number || 'House Number')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>
                    {profileLoading ? 'Loading...' : (ownerProfile?.phone || 'Contact Number')}
                  </span>
                </div>
              </div>
            </div>
            
            <Badge variant="default" className="bg-green-100 text-green-800">
              Connected
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Main Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="complaints" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Complaints
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DocumentUpload 
              userId={currentUserId} 
              relationshipId={relationship.id}
              onDocumentUploaded={handleDocumentUploaded}
            />
            <DocumentList 
              documents={documents}
              isOwner={false}
              onDocumentStatusChanged={loadDocuments}
            />
          </div>
        </TabsContent>

        <TabsContent value="complaints" className="space-y-6">
          <RenterComplaints relationshipId={relationship.id} />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <RenterPayments relationshipId={relationship.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PostConnectionInterface;
