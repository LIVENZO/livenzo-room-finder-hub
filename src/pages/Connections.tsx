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
import { useRelationships } from '@/hooks/useRelationships';

const Connections = () => {
  const { user, userRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { relationshipId } = useParams<{ relationshipId: string }>();
  const isOwner = userRole === 'owner';
  const notificationState = location.state as any;

  const { collaborations } = useCollaborations();
  const pendingCollaboratorCount = useMemo(
    () => collaborations.filter((c) => c.i_am === 'owner' && c.status === 'pending').length,
    [collaborations]
  );

  // Lightweight fetch for header badges (Renters section owns its own data too)
  const { ownerRelationships } = useRelationships(user?.id, isOwner);
  const pendingRequestsCount = useMemo(
    () =>
      ownerRelationships.filter(
        (r) =>
          r.status === 'pending' ||
          (r.status === 'accepted' && !!r.disconnect_requested_at),
      ).length,
    [ownerRelationships]
  );
  const connectedCount = useMemo(
    () =>
      ownerRelationships.filter(
        (r) => r.status === 'accepted' && !r.disconnect_requested_at,
      ).length,
    [ownerRelationships]
  );

  const searchParams = new URLSearchParams(location.search);
  const queryTab = searchParams.get('tab') || undefined;
  const showDocumentsParam = searchParams.get('showDocuments') === 'true';
  const showComplaintsParam = searchParams.get('showComplaints') === 'true';
  const queryDocumentId = searchParams.get('documentId') || undefined;
  const queryComplaintId = searchParams.get('complaintId') || undefined;
  const queryRenterId = searchParams.get('renterId') || undefined;

  const initialTab =
    notificationState?.defaultTab ||
    queryTab ||
    (showDocumentsParam || showComplaintsParam || relationshipId ? 'connected' : 'requests');

  const specificRenterData = relationshipId
    ? {
        relationshipId,
        documentId: notificationState?.documentId || (showDocumentsParam ? queryDocumentId : undefined),
        complaintId: notificationState?.complaintId || (showComplaintsParam ? queryComplaintId : undefined),
        openRenterDetail: true,
      }
    : undefined;

  const documentNotification =
    notificationState?.showDocuments || showDocumentsParam
      ? {
          showDocuments: true,
          documentId: notificationState?.documentId || queryDocumentId,
          renterId: notificationState?.renterId || queryRenterId,
        }
      : undefined;

  const complaintNotification =
    notificationState?.showComplaints || showComplaintsParam
      ? {
          showComplaints: true,
          complaintId: notificationState?.complaintId || queryComplaintId,
          renterId: notificationState?.renterId || queryRenterId,
        }
      : undefined;

  useEffect(() => {
    if (!isLoading && !user?.id) {
      navigate('/');
    }
  }, [user?.id, isLoading, navigate]);

  if (isLoading) {
    return (
      <Layout>
        <div className="w-full h-full p-6">
          <div className="text-center p-8">
            <p className="text-lg">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }
  if (!user?.id) {
    return (
      <Layout>
        <div className="w-full h-full p-6">
          <div className="text-center p-8">
            <p className="text-lg">Please login to manage connections</p>
          </div>
        </div>
      </Layout>
    );
  }

  const getPageTitle = () => (isOwner ? 'Connections' : 'Find Your Owner');

  return (
    <Layout>
      <div className="w-full h-full pb-8">
        <header className="px-4 pt-2 pb-4">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{getPageTitle()}</h1>
          {isOwner && (
            <p className="mt-1 text-sm text-muted-foreground">
              Manage renter requests, active connections, and collaborators.
            </p>
          )}
        </header>

        {isOwner ? (
          <Tabs defaultValue={initialTab} className="w-full">
            <div className="sticky top-0 z-10 -mt-2 border-b border-border/60 bg-background/85 px-4 pb-3 pt-2 backdrop-blur supports-[backdrop-filter]:bg-background/70">
              <TabsList className="grid h-11 w-full grid-cols-3 rounded-xl bg-muted p-1">
                <TabsTrigger
                  value="requests"
                  className="flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Requests
                  {pendingRequestsCount > 0 && (
                    <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px]">
                      {pendingRequestsCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="connected"
                  className="flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Connected
                  {connectedCount > 0 && (
                    <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px]">
                      {connectedCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="collaborators"
                  className="flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <span className="truncate">Collab</span>
                  {pendingCollaboratorCount > 0 && (
                    <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px]">
                      {pendingCollaboratorCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="px-4 pt-4">
              <TabsContent value="requests" className="mt-0 focus-visible:outline-none">
                <RentersPage
                  currentUserId={user.id}
                  section="requests"
                  documentNotification={documentNotification}
                  complaintNotification={complaintNotification}
                  specificRenterData={specificRenterData}
                />
              </TabsContent>
              <TabsContent value="connected" className="mt-0 focus-visible:outline-none">
                <RentersPage
                  currentUserId={user.id}
                  section="connected"
                  documentNotification={documentNotification}
                  complaintNotification={complaintNotification}
                  specificRenterData={specificRenterData}
                />
              </TabsContent>
              <TabsContent value="collaborators" className="mt-0 space-y-5 focus-visible:outline-none">
                <UserSearch currentUserId={user.id} />
                <CollaborationCenter />
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <div className="px-4">
            <ConnectWithOwner currentUserId={user.id} />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Connections;
