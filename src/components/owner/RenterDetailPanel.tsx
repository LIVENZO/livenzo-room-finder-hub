
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header - Mobile edge-to-edge */}
      <div className="px-4 py-4 sm:px-6 sm:py-6">
        <RenterHeader relationship={relationship} onBack={onBack} />
      </div>

      {/* Quick Action Buttons - Only show in full mode */}
      {mode === 'full' && (
        <div className="px-4 pb-6 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={handleSwitchToComplaints}
              className="h-16 justify-start gap-4 bg-gradient-to-r from-red-50 to-orange-50 border-red-200/60 text-red-700 hover:from-red-100 hover:to-orange-100 hover:shadow-lg rounded-2xl shadow-md active:scale-[0.98] transition-all duration-200 font-semibold"
            >
              <AlertTriangle className="h-6 w-6" />
              <span>View Complaints</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleSwitchToDocuments}
              className="h-16 justify-start gap-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200/60 text-blue-700 hover:from-blue-100 hover:to-cyan-100 hover:shadow-lg rounded-2xl shadow-md active:scale-[0.98] transition-all duration-200 font-semibold"
            >
              <FileText className="h-6 w-6" />
              <span>View Documents</span>
            </Button>
          </div>
        </div>
      )}

      {/* Navigation buttons when in single mode */}
      {(mode === 'documents' || mode === 'complaints') && (
        <div className="px-4 pb-6 sm:px-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {mode === 'documents' && (
              <Button
                variant="outline"
                onClick={handleSwitchToComplaints}
                className="w-full sm:w-auto h-14 gap-3 bg-gradient-to-r from-red-50 to-orange-50 border-red-200/60 text-red-700 hover:from-red-100 hover:to-orange-100 hover:shadow-lg rounded-2xl shadow-md active:scale-[0.98] transition-all duration-200 font-medium"
              >
                <AlertTriangle className="h-5 w-5" />
                <span>View Complaints</span>
              </Button>
            )}
            {mode === 'complaints' && (
              <Button
                variant="outline"
                onClick={handleSwitchToDocuments}
                className="w-full sm:w-auto h-14 gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200/60 text-blue-700 hover:from-blue-100 hover:to-cyan-100 hover:shadow-lg rounded-2xl shadow-md active:scale-[0.98] transition-all duration-200 font-medium"
              >
                <FileText className="h-5 w-5" />
                <span>View Documents</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Content Area - Edge-to-edge on mobile */}
      <div className="bg-card rounded-t-3xl sm:rounded-2xl shadow-xl border-t sm:border overflow-hidden min-h-[60vh]">
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
                  <div className="bg-gradient-to-br from-cyan-50 to-blue-100 rounded-3xl p-10 text-center border border-cyan-200/50 shadow-lg backdrop-blur-sm">
                    <div className="bg-white/70 rounded-full p-4 w-20 h-20 mx-auto mb-6 shadow-md">
                      <FileText className="h-12 w-12 text-cyan-600 mx-auto" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-3">No Documents Yet</h3>
                    <p className="text-slate-600 text-base leading-relaxed">This renter hasn't uploaded any documents. When they do, you'll see them here for review and approval.</p>
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
