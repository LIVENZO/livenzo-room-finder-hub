import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Clock, Unlink } from 'lucide-react';
import { requestDisconnectFromOwner } from '@/services/relationship/manageRelationships';
import { Relationship } from '@/types/relationship';

interface RenterDisconnectButtonProps {
  relationship: Relationship;
  onDisconnect: () => void;
  className?: string;
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

const RenterDisconnectButton: React.FC<RenterDisconnectButtonProps> = ({
  relationship,
  onDisconnect,
  className = '',
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pending = !!relationship.disconnect_requested_at;
  const autoApproveOn = formatDate(relationship.disconnect_auto_approve_at);

  const handleRequest = async () => {
    setIsSubmitting(true);
    try {
      const ok = await requestDisconnectFromOwner(relationship.id, relationship.renter_id);
      if (ok) onDisconnect();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pending) {
    return (
      <div
        className={`flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 ${className}`}
      >
        <Clock className="h-4 w-4 shrink-0" />
        <span>
          Disconnect requested — awaiting owner approval
          {autoApproveOn ? ` (auto-approves on ${autoApproveOn})` : ''}
        </span>
      </div>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          className={`flex items-center gap-2 ${className}`}
          disabled={isSubmitting}
        >
          <Unlink className="h-4 w-4" />
          {isSubmitting ? 'Sending…' : 'Disconnect from Owner'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Request to disconnect?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              <p>
                This sends a disconnect request to{' '}
                <span className="font-semibold">
                  {relationship.owner?.full_name || 'your owner'}
                </span>
                . You will stay connected until the owner approves it.
              </p>
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">
                <p className="font-medium">How it works</p>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  <li>The owner must approve your request to end the connection.</li>
                  <li>
                    If the owner doesn't respond within{' '}
                    <span className="font-semibold">7 days</span>, the request is
                    automatically approved and you're disconnected.
                  </li>
                </ul>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRequest}
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? 'Sending…' : 'Request Disconnect'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RenterDisconnectButton;
