import React, { useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/auth';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import ConnectWithOwner from '@/components/renter/ConnectWithOwner';
import RentersPage from '@/components/owner/RentersPage';
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
  
  // Build data for opening a specific renter's detail page
  const specificRenterData = relationshipId ? {
    relationshipId,
    documentId: notificationState?.documentId || (showDocumentsParam ? queryDocumentId : undefined),
    complaintId: notificationState?.complaintId || (showComplaintsParam ? queryComplaintId : undefined),
    openRenterDetail: true
  } : undefined;
  
  // Extract document notification data (fallback to query params)
  const documentNotification = (notificationState?.showDocuments || showDocumentsParam) ? {
    showDocuments: true,
    documentId: notificationState?.documentId || queryDocumentId,
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
  const getPageTitle = () => {
    return isOwner ? 'Renters' : 'Find Your Owner';
  };
  const getPageDescription = () => {
    return isOwner ? 'Manage connection requests and connected renters' : 'Connect with your property owner to manage your rental relationship';
  };
  return <Layout>
      <div className="w-full h-full">
        <div className="mb-6 px-4">
          <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
          
        </div>
        
        {isOwner ? (
          <RentersPage 
            currentUserId={user.id} 
            defaultTab={defaultTab}
            documentNotification={documentNotification}
            specificRenterData={specificRenterData}
          />
        ) : (
          <ConnectWithOwner currentUserId={user.id} />
        )}
      </div>
    </Layout>;
};
export default Connections;