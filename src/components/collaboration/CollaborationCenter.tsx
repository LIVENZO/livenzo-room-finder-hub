import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, Eye, User, CheckCircle2, XCircle, Trash2, Building2 } from 'lucide-react';
import { useCollaborations } from '@/hooks/useCollaborations';
import { useOwnerProperty } from '@/context/OwnerPropertyContext';
import {
  respondCollaborationRequest,
  revokeCollaborator,
  type Collaboration,
  type CollaboratorRole,
} from '@/services/collaborationService';
import RoleSelectionDialog from './RoleSelectionDialog';
import { toast } from 'sonner';

const RoleBadge: React.FC<{ role: CollaboratorRole | null }> = ({ role }) => {
  if (!role) return null;
  const isManager = role === 'manager';
  return (
    <Badge variant={isManager ? 'default' : 'secondary'} className="gap-1 capitalize">
      {isManager ? <Briefcase className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
      {role}
    </Badge>
  );
};

const CollaborationCenter: React.FC = () => {
  const { collaborations, loading, refresh } = useCollaborations();
  const { activeProperty } = useOwnerProperty();
  const [pendingTarget, setPendingTarget] = useState<Collaboration | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Scope to active property — only show what belongs to the currently selected property
  const scoped = useMemo(
    () => collaborations.filter((c) => !activeProperty || c.property_id === activeProperty.id),
    [collaborations, activeProperty],
  );

  // Incoming = I am owner & status pending (someone wants to collaborate on my property)
  const incoming = scoped.filter((c) => c.i_am === 'owner' && c.status === 'pending');
  // Active collaborators on my property
  const active = scoped.filter((c) => c.i_am === 'owner' && c.status === 'accepted');
  // Outgoing = I am collaborator (sent or accepted into other properties — across all)
  const outgoing = collaborations.filter(
    (c) => c.i_am === 'collaborator' && (c.status === 'pending' || c.status === 'accepted'),
  );

  const handleDecline = async (c: Collaboration) => {
    setBusyId(c.id);
    try {
      await respondCollaborationRequest(c.id, 'decline');
      toast.success('Request declined');
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to decline');
    } finally {
      setBusyId(null);
    }
  };

  const handleAccept = async (role: CollaboratorRole) => {
    if (!pendingTarget) return;
    try {
      await respondCollaborationRequest(pendingTarget.id, 'accept', role);
      toast.success(`Added as ${role}`);
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to accept');
    } finally {
      setPendingTarget(null);
    }
  };

  const handleRevoke = async (c: Collaboration) => {
    setBusyId(c.id);
    try {
      await revokeCollaborator(c.id);
      toast.success('Collaborator removed');
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to revoke');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h2 className="text-lg font-semibold">Property Collaborators</h2>
        <p className="text-xs text-muted-foreground">
          Owner-to-owner staff access for {activeProperty?.hostel_pg_name || 'your property'}.
        </p>
      </div>

      <Tabs defaultValue="incoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="incoming" className="flex items-center gap-1.5 text-xs">
            Incoming
            {incoming.length > 0 && <Badge variant="destructive" className="h-4 px-1.5">{incoming.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="team" className="text-xs">Team</TabsTrigger>
          <TabsTrigger value="outgoing" className="text-xs">Sent</TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="space-y-3 mt-3">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Loading…</p>
          ) : incoming.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No pending collaboration requests.</p>
          ) : (
            incoming.map((c) => (
              <Card key={c.id} className="rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={c.collaborator_avatar || ''} />
                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{c.collaborator_name || 'Owner'}</p>
                      <p className="text-xs text-muted-foreground">
                        wants collaborator access to {c.property_name || 'your property'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => setPendingTarget(c)}
                      disabled={busyId === c.id}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1"
                      onClick={() => handleDecline(c)}
                      disabled={busyId === c.id}
                    >
                      <XCircle className="h-4 w-4" /> Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-3 mt-3">
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No collaborators yet.</p>
          ) : (
            active.map((c) => (
              <Card key={c.id} className="rounded-xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={c.collaborator_avatar || ''} />
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.collaborator_name || 'Owner'}</p>
                    <RoleBadge role={c.role} />
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRevoke(c)}
                    disabled={busyId === c.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="outgoing" className="space-y-3 mt-3">
          {outgoing.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              You haven't requested collaborator access on any property.
            </p>
          ) : (
            outgoing.map((c) => (
              <Card key={c.id} className="rounded-xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.property_name || 'Property'}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={c.status === 'accepted' ? 'default' : 'secondary'} className="capitalize">
                        {c.status}
                      </Badge>
                      <RoleBadge role={c.role} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <RoleSelectionDialog
        open={!!pendingTarget}
        onOpenChange={(open) => !open && setPendingTarget(null)}
        onConfirm={handleAccept}
        collaboratorName={pendingTarget?.collaborator_name || undefined}
      />
    </div>
  );
};

export default CollaborationCenter;
