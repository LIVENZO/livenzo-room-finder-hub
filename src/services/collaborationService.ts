import { supabase } from '@/integrations/supabase/client';

export type CollaboratorRole = 'manager' | 'viewer';
export type CollaborationStatus = 'pending' | 'accepted' | 'declined' | 'revoked';

export interface Collaboration {
  id: string;
  property_id: string;
  property_name: string | null;
  property_public_id: string | null;
  owner_id: string;
  owner_name: string | null;
  owner_avatar: string | null;
  collaborator_id: string;
  collaborator_name: string | null;
  collaborator_avatar: string | null;
  role: CollaboratorRole | null;
  status: CollaborationStatus;
  created_at: string;
  updated_at: string;
  i_am: 'owner' | 'collaborator';
}

export const sendCollaborationRequest = async (propertyPublicId: string) => {
  const { data, error } = await supabase.rpc('send_collaboration_request', {
    p_property_public_id: propertyPublicId.toLowerCase(),
  });
  if (error) throw error;
  return data;
};

export const respondCollaborationRequest = async (
  requestId: string,
  action: 'accept' | 'decline',
  role?: CollaboratorRole,
) => {
  const { data, error } = await supabase.rpc('respond_collaboration_request', {
    p_request_id: requestId,
    p_action: action,
    p_role: role ?? null,
  });
  if (error) throw error;
  return data;
};

export const revokeCollaborator = async (requestId: string) => {
  const { error } = await supabase.rpc('revoke_collaborator', { p_request_id: requestId });
  if (error) throw error;
};

export const fetchMyCollaborations = async (): Promise<Collaboration[]> => {
  const { data, error } = await supabase.rpc('get_my_collaborations');
  if (error) throw error;
  return (data || []) as Collaboration[];
};

export const fetchPropertyRole = async (
  propertyId: string,
  userId: string,
): Promise<'owner' | CollaboratorRole | null> => {
  const { data, error } = await supabase.rpc('get_property_role', {
    p_property_id: propertyId,
    p_user_id: userId,
  });
  if (error) return null;
  return (data as any) || null;
};
