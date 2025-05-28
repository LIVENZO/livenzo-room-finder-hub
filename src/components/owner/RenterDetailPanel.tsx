
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Relationship } from '@/types/relationship';
import { Document, fetchDocumentsForRelationship } from '@/services/DocumentService';
import DocumentList from '@/components/document/DocumentList';
import RenterHeader from './renter-detail/RenterHeader';
import OverviewTab from './renter-detail/OverviewTab';
import ComplaintsTab from './renter-detail/ComplaintsTab';
import PaymentsTab from './renter-detail/PaymentsTab';
import NotesTab from './renter-detail/NotesTab';
import { toast } from 'sonner';

interface RenterDetailPanelProps {
  relationship: Relationship;
  initialTab?: string;
  onBack: () => void;
  onRefresh: () => void;
}

const RenterDetailPanel: React.FC<RenterDetailPanelProps> = ({
  relationship,
  initialTab = 'overview',
  onBack,
  onRefresh,
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    loadDocuments();
  }, [relationship.id]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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

  const handleDocumentStatusChanged = async () => {
    await loadDocuments();
  };

  return (
    <div className="space-y-6">
      <RenterHeader relationship={relationship} onBack={onBack} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab onTabChange={setActiveTab} />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <DocumentList 
            documents={documents}
            isOwner={true}
            onDocumentStatusChanged={handleDocumentStatusChanged}
          />
        </TabsContent>

        <TabsContent value="complaints" className="space-y-4">
          <ComplaintsTab relationshipId={relationship.id} />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <PaymentsTab />
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <NotesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RenterDetailPanel;
