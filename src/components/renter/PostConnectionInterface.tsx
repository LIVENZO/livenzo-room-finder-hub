
import React, { useState, useEffect } from 'react';
import { Relationship } from '@/types/relationship';
import { fetchDocumentsForRelationship, type Document } from '@/services/DocumentService';
import { fetchOwnerProfileForRenter } from '@/services/OwnerProfileService';
import { UserProfile } from '@/services/UserProfileService';
import OwnerInfoCard from './post-connection/OwnerInfoCard';
import ConnectionTabs from './post-connection/ConnectionTabs';

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
        <OwnerInfoCard
          relationship={relationship}
          ownerProfile={ownerProfile}
          profileLoading={profileLoading}
        />

        <ConnectionTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentUserId={currentUserId}
          relationshipId={relationship.id}
          documents={documents}
          onDocumentUploaded={handleDocumentUploaded}
          onDocumentStatusChanged={loadDocuments}
        />
      </div>
    </div>
  );
};

export default PostConnectionInterface;
