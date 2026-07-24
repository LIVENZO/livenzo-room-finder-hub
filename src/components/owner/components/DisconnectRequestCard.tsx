import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Unlink, Check, X, Clock } from 'lucide-react';
import { Relationship } from '@/types/relationship';

interface DisconnectRequestCardProps {
  relationship: Relationship;
  onApprove: (relationshipId: string) => void;
  onReject: (relationshipId: string) => void;
  isProcessing: boolean;
}

const formatDate = (iso?: string | null) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

const DisconnectRequestCard: React.FC<DisconnectRequestCardProps> = ({
  relationship,
  onApprove,
  onReject,
  isProcessing,
}) => {
  const autoApproveOn = formatDate(relationship.disconnect_auto_approve_at);
  const requestedOn = formatDate(relationship.disconnect_requested_at);

  return (
    <Card className="border-amber-200">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Avatar className="h-11 w-11">
              <AvatarImage src={relationship.renter?.avatar_url || ''} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold sm:text-lg">
                  {relationship.renter?.full_name || 'Renter'}
                </h3>
                <Badge
                  variant="outline"
                  className="border-amber-300 bg-amber-50 text-amber-800"
                >
                  <Unlink className="mr-1 h-3 w-3" />
                  Disconnect requested
                </Badge>
              </div>

              {relationship.renter?.room_number && (
                <p className="mt-1 text-sm text-foreground/80">
                  Room No:{' '}
                  <span className="font-semibold">
                    {relationship.renter.room_number}
                  </span>
                </p>
              )}

              {requestedOn && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Requested on {requestedOn}
                </p>
              )}

              {autoApproveOn && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800">
                  <Clock className="h-3 w-3" />
                  Auto-approves on {autoApproveOn} if no action
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 sm:flex-shrink-0">
            <Button
              onClick={() => onApprove(relationship.id)}
              disabled={isProcessing}
              className="flex-1 bg-red-600 hover:bg-red-700 sm:flex-none"
              size="sm"
            >
              <Check className="mr-1 h-4 w-4" />
              Approve
            </Button>
            <Button
              onClick={() => onReject(relationship.id)}
              disabled={isProcessing}
              variant="outline"
              className="flex-1 sm:flex-none"
              size="sm"
            >
              <X className="mr-1 h-4 w-4" />
              Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DisconnectRequestCard;
