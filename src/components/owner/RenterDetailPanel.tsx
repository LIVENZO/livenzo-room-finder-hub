
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertTriangle, FileText } from 'lucide-react';
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
    <div className="space-y-4 px-0 sm:px-6 lg:px-8 py-0 sm:py-4 min-h-screen bg-background">
      <div className="px-4 sm:px-0">
        <RenterHeader relationship={relationship} onBack={onBack} />
      </div>

      {/* Quick Action Buttons - Only show in full mode */}
      {mode === 'full' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 sm:px-0">
          <Button
            variant="outline"
            onClick={handleSwitchToComplaints}
            className="h-14 justify-start gap-3 bg-red-50/50 border-red-200/50 text-red-700 hover:bg-red-100/70 rounded-xl shadow-sm active:scale-[0.98] transition-all"
          >
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">View Complaints</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleSwitchToDocuments}
            className="h-14 justify-start gap-3 bg-blue-50/50 border-blue-200/50 text-blue-700 hover:bg-blue-100/70 rounded-xl shadow-sm active:scale-[0.98] transition-all"
          >
            <FileText className="h-5 w-5" />
            <span className="font-medium">View Documents</span>
          </Button>
        </div>
      )}

      {/* Navigation buttons when in single mode */}
      {(mode === 'documents' || mode === 'complaints') && (
        <div className="flex flex-col sm:flex-row gap-4 px-4 sm:px-0">
          {mode === 'documents' && (
            <Button
              variant="outline"
              onClick={handleSwitchToComplaints}
              className="w-full sm:w-auto h-12 gap-2 bg-red-50/50 border-red-200/50 text-red-700 hover:bg-red-100/70 rounded-xl shadow-sm active:scale-[0.98] transition-all"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>View Complaints</span>
            </Button>
          )}
          {mode === 'complaints' && (
            <Button
              variant="outline"
              onClick={handleSwitchToDocuments}
              className="w-full sm:w-auto h-12 gap-2 bg-blue-50/50 border-blue-200/50 text-blue-700 hover:bg-blue-100/70 rounded-xl shadow-sm active:scale-[0.98] transition-all"
            >
              <FileText className="h-4 w-4" />
              <span>View Documents</span>
            </Button>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="bg-card rounded-t-lg sm:rounded-lg border-0 sm:border shadow-sm mx-0 sm:mx-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {visibleTabs.length > 1 && (
            <div className="border-b px-6 pt-4">
              <TabsList className={`grid w-full ${visibleTabs.length === 1 ? 'grid-cols-1' : 
                visibleTabs.length === 2 ? 'grid-cols-2' : 
                visibleTabs.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} h-10 bg-muted/50`}>
                {visibleTabs.includes('overview') && (
                  <TabsTrigger value="overview" className="text-sm font-medium">Overview</TabsTrigger>
                )}
                {visibleTabs.includes('documents') && (
                  <TabsTrigger value="documents" className="text-sm font-medium">Documents</TabsTrigger>
                )}
                {visibleTabs.includes('complaints') && (
                  <TabsTrigger value="complaints" className="text-sm font-medium">Complaints</TabsTrigger>
                )}
                {visibleTabs.includes('notes') && (
                  <TabsTrigger value="notes" className="text-sm font-medium">Notes</TabsTrigger>
                )}
              </TabsList>
            </div>
          )}

          <div className="p-6">
            {visibleTabs.includes('overview') && (
              <TabsContent value="overview" className="mt-0 space-y-4">
                <OverviewTab onTabChange={setActiveTab} />
              </TabsContent>
            )}

            {visibleTabs.includes('documents') && (
              <TabsContent value="documents" className="mt-0">
                {documents.length === 0 ? (
                  <div className="bg-blue-50/30 rounded-2xl p-8 text-center border border-blue-100/50">
                    <FileText className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No Documents</h3>
                    <p className="text-muted-foreground">No documents uploaded yet by this renter.</p>
                  </div>
                ) : (
                  <DocumentList 
                    documents={documents}
                    isOwner={true}
                    onDocumentStatusChanged={handleDocumentStatusChanged}
                  />
                )}
              </TabsContent>
            )}

            {visibleTabs.includes('complaints') && (
              <TabsContent value="complaints" className="mt-0">
                <div className="bg-purple-50/30 rounded-2xl p-6 border border-purple-100/50">
                  <ComplaintsTab relationshipId={relationship.id} />
                </div>
              </TabsContent>
            )}

            {visibleTabs.includes('notes') && (
              <TabsContent value="notes" className="mt-0">
                <NotesTab />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default RenterDetailPanel;
