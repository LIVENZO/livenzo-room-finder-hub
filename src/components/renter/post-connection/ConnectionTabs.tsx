
import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, AlertTriangle, DollarSign } from 'lucide-react';
import DocumentsTab from './DocumentsTab';
import ComplaintsTab from './ComplaintsTab';
import PaymentsTab from './PaymentsTab';
import { Document } from '@/services/DocumentService';

interface ConnectionTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  currentUserId: string;
  relationshipId: string;
  documents: Document[];
  onDocumentUploaded: () => void;
  onDocumentStatusChanged: () => void;
}

const ConnectionTabs: React.FC<ConnectionTabsProps> = ({
  activeTab,
  onTabChange,
  currentUserId,
  relationshipId,
  documents,
  onDocumentUploaded,
  onDocumentStatusChanged
}) => {
  return (
    <Card className="bg-white shadow-lg rounded-xl border-slate-200">
      <Tabs value={activeTab} onValueChange={onTabChange}>
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
            <DocumentsTab
              currentUserId={currentUserId}
              relationshipId={relationshipId}
              documents={documents}
              onDocumentUploaded={onDocumentUploaded}
              onDocumentStatusChanged={onDocumentStatusChanged}
            />
          </TabsContent>

          <TabsContent value="complaints" className="space-y-6 mt-0">
            <ComplaintsTab relationshipId={relationshipId} />
          </TabsContent>

          <TabsContent value="payments" className="space-y-6 mt-0">
            <PaymentsTab relationshipId={relationshipId} />
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
};

export default ConnectionTabs;
