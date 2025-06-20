
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { Relationship } from '@/types/relationship';
import { Document, fetchDocumentsForRelationship } from '@/services/DocumentService';
import DocumentList from '@/components/document/DocumentList';
import RenterHeader from './renter-detail/RenterHeader';
import OverviewTab from './renter-detail/OverviewTab';
import ComplaintsTab from './renter-detail/ComplaintsTab';
import NotesTab from './renter-detail/NotesTab';
import { toast } from 'sonner';

interface RenterDetailPanelProps {
  relationship: Relationship;
  initialTab?: string;
  mode?: 'full' | 'documents' | 'complaints';
  onBack: () => void;
  onRefresh: () => void;
  onModeChange?: (mode: 'full' | 'documents' | 'complaints') => void;
}

const RenterDetailPanel: React.FC<RenterDetailPanelProps> = ({
  relationship,
  initialTab = 'overview',
  mode = 'full',
  onBack,
  onRefresh,
  onModeChange,
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    loadDocuments();
  }, [relationship.id]);

  useEffect(() => {
    // Set initial tab based on mode
    if (mode === 'documents') {
      setActiveTab('documents');
    } else if (mode === 'complaints') {
      setActiveTab('complaints');
    } else {
      setActiveTab(initialTab);
    }
  }, [initialTab, mode]);

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

  const handleSwitchToComplaints = () => {
    if (onModeChange) {
      onModeChange('complaints');
    }
  };

  const handleSwitchToDocuments = () => {
    if (onModeChange) {
      onModeChange('documents');
    }
  };

  // Determine which tabs to show based on mode
  const getVisibleTabs = () => {
    switch (mode) {
      case 'documents':
        return ['documents'];
      case 'complaints':
        return ['complaints'];
      case 'full':
      default:
        return ['overview', 'documents', 'complaints', 'notes'];
    }
  };

  const visibleTabs = getVisibleTabs();

  return (
    <div className="space-y-6">
      <RenterHeader relationship={relationship} onBack={onBack} />

      {/* Show navigation buttons when in single mode */}
      {(mode === 'documents' || mode === 'complaints') && (
        <div className="flex gap-2">
          {mode === 'documents' && (
            <Button
              variant="outline"
              onClick={handleSwitchToComplaints}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              View Complaints
            </Button>
          )}
          {mode === 'complaints' && (
            <Button
              variant="outline"
              onClick={handleSwitchToDocuments}
              className="flex items-center gap-2"
            >
              View Documents
            </Button>
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid w-full grid-cols-${visibleTabs.length}`}>
          {visibleTabs.includes('overview') && (
            <TabsTrigger value="overview">Overview</TabsTrigger>
          )}
          {visibleTabs.includes('documents') && (
            <TabsTrigger value="documents">Documents</TabsTrigger>
          )}
          {visibleTabs.includes('complaints') && (
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
          )}
          {visibleTabs.includes('notes') && (
            <TabsTrigger value="notes">Notes</TabsTrigger>
          )}
        </TabsList>

        {visibleTabs.includes('overview') && (
          <TabsContent value="overview" className="space-y-4">
            <OverviewTab onTabChange={setActiveTab} />
          </TabsContent>
        )}

        {visibleTabs.includes('documents') && (
          <TabsContent value="documents" className="space-y-4">
            <DocumentList 
              documents={documents}
              isOwner={true}
              onDocumentStatusChanged={handleDocumentStatusChanged}
            />
          </TabsContent>
        )}

        {visibleTabs.includes('complaints') && (
          <TabsContent value="complaints" className="space-y-4">
            <ComplaintsTab relationshipId={relationship.id} />
          </TabsContent>
        )}

        {visibleTabs.includes('notes') && (
          <TabsContent value="notes" className="space-y-4">
            <NotesTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default RenterDetailPanel;
