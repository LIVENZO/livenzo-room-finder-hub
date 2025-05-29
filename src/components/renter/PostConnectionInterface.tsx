
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
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Owner Info Card */}
        <Card className="bg-blue-50 border-blue-100 shadow-lg rounded-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-4 ring-white shadow-md">
                <AvatarImage src={owner?.avatar_url || ''} />
                <AvatarFallback className="bg-blue-100">
                  <Home className="h-8 w-8 text-blue-600" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  {owner?.full_name || 'Property Owner'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Home className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-600">PG/Hostel Name</span>
                    </div>
                    <div className="text-base font-bold text-slate-900">
                      {profileLoading ? (
                        <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                      ) : (
                        ownerProfile?.property_name || 'Not specified'
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-600">House Number</span>
                    </div>
                    <div className="text-base font-bold text-slate-900">
                      {profileLoading ? (
                        <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                      ) : (
                        ownerProfile?.house_number || 'Not specified'
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-600">Contact Number</span>
                    </div>
                    <div className="text-base font-bold text-emerald-600">
                      {profileLoading ? (
                        <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                      ) : (
                        ownerProfile?.phone || 'Not specified'
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <Badge variant="default" className="bg-emerald-100 text-emerald-800 border-emerald-200 px-3 py-1 font-semibold shadow-sm">
                Connected
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Main Interface */}
        <Card className="bg-white shadow-lg rounded-xl border-slate-200">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-lg">
              <TabsTrigger 
                value="documents" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <FileText className="h-4 w-4" />
                Documents
              </TabsTrigger>
              <TabsTrigger 
                value="complaints" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <AlertTriangle className="h-4 w-4" />
                Complaints
              </TabsTrigger>
              <TabsTrigger 
                value="payments" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <DollarSign className="h-4 w-4" />
                Payments
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="documents" className="space-y-6 mt-0">
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

              <TabsContent value="complaints" className="space-y-6 mt-0">
                <RenterComplaints relationshipId={relationship.id} />
              </TabsContent>

              <TabsContent value="payments" className="space-y-6 mt-0">
                <RenterPayments relationshipId={relationship.id} />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default PostConnectionInterface;
