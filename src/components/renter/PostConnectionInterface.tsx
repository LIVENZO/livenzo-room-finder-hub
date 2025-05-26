
import React, { useState } from 'react';
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
import RenterComplaints from '@/components/renter/RenterComplaints';
import RenterPayments from '@/components/renter/RenterPayments';

interface PostConnectionInterfaceProps {
  relationship: Relationship;
  currentUserId: string;
}

const PostConnectionInterface: React.FC<PostConnectionInterfaceProps> = ({
  relationship,
  currentUserId
}) => {
  const [activeTab, setActiveTab] = useState('documents');

  const owner = relationship.owner;

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
                  <span>PG/Hostel Name</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>House Number</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>Contact Number</span>
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
            />
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Your uploaded documents will appear here</p>
              </CardContent>
            </Card>
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
