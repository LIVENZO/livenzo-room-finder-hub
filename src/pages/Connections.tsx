import React, { useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/auth';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import ConnectWithOwner from '@/components/renter/ConnectWithOwner';
import RentersPage from '@/components/owner/RentersPage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import CollaborationCenter from '@/components/collaboration/CollaborationCenter';
import UserSearch from '@/components/relationship/UserSearch';
import { useCollaborations } from '@/hooks/useCollaborations';

const Connections = () => {
  const {
    user,
    userRole,
    isLoading
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { relationshipId } = useParams<{ relationshipId: string }>();
  const isOwner = userRole === 'owner';
  const notificationState = location.state as any;

  // Fetch collaborations for pending badge on Collaborators tab
  const { collaborations } = useCollaborations();
  const pendingCollaboratorCount = useMemo(
    () => collaborations.filter(c => c.i_am === 'owner' && c.status === 'pending').length,
    [collaborations]
  );

  // Parse query params to support direct deep links without history state
  const searchParams = new URLSearchParams(location.search);
  const queryTab = searchParams.get('tab') || undefined;
  const showDocumentsParam = searchParams.get('showDocuments') === 'true';
  const showComplaintsParam = searchParams.get('showComplaints') === 'true';
  const queryDocumentId = searchParams.get('documentId') || undefined;
  const queryComplaintId = searchParams.get('complaintId') || undefined;
  const queryRenterId = searchParams.get('renterId') || undefined;

  const [defaultTab, setDefaultTab] = React.useState<string | undefined>(
    notificationState?.defaultTab || queryTab
  );

  const specificRenterData = relationshipId ? {
    relationshipId,
    documentId: notificationState?.documentId || (showDocumentsParam ? queryDocumentId : undefined),
    complaintId: notificationState?.complaintId || (showComplaintsParam ? queryComplaintId : undefined),
    openRenterDetail: true
  } : undefined;

  const documentNotification = (notificationState?.showDocuments || showDocumentsParam) ? {
    showDocuments: true,
    documentId: notificationState?.documentId || queryDocumentId,
    renterId: notificationState?.renterId || queryRenterId
  } : undefined;

  const complaintNotification = (notificationState?.showComplaints || showComplaintsParam) ? {
    showComplaints: true,
    complaintId: notificationState?.complaintId || queryComplaintId,
    renterId: notificationState?.renterId || queryRenterId
  } : undefined;

  useEffect(() => {
    if (!isLoading && !user?.id) {
      navigate('/');
    }
  }, [user?.id, isLoading, navigate]);

  if (isLoading) {
    return <Layout>
        <div className="w-full h-full p-6">
          <div className="text-center p-8">
            <p className="text-lg">Loading...</p>
          </div>
        </div>
      </Layout>;
  }
  if (!user?.id) {
    return <Layout>
        <div className="w-full h-full p-6">
          <div className="text-center p-8">
            <p className="text-lg">Please login to manage connections</p>
          </div>
        </div>
      </Layout>;
  }

  const getPageTitle = () => isOwner ? 'Connections' : 'Find Your Owner';

  return <Layout>
      <div className="w-full h-full">
        <div className="mb-4 px-4">
          <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
        </div>

        {isOwner ? (
          <Tabs defaultValue="renters" className="w-full px-4">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="renters">Renters</TabsTrigger>
              <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
            </TabsList>
            <TabsContent value="renters" className="mt-0 -mx-4">
              <RentersPage
                currentUserId={user.id}
                defaultTab={defaultTab}
                documentNotification={documentNotification}
                complaintNotification={complaintNotification}
                specificRenterData={specificRenterData}
              />
            </TabsContent>
            <TabsContent value="collaborators" className="mt-0 space-y-6">
              <UserSearch currentUserId={user.id} />
              <CollaborationCenter />
            </TabsContent>
          </Tabs>
        ) : (
          <ConnectWithOwner currentUserId={user.id} />
        )}
      </div>
    </Layout>;
};
export default Connections;
