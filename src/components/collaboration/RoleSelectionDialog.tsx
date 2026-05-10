import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Briefcase, Eye, Check } from 'lucide-react';
import type { CollaboratorRole } from '@/services/collaborationService';
import { cn } from '@/lib/utils';

interface RoleSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (role: CollaboratorRole) => Promise<void> | void;
  collaboratorName?: string;
}

const ROLES: {
  value: CollaboratorRole;
  title: string;
  icon: React.ReactNode;
  tagline: string;
  permissions: string[];
}[] = [
  {
    value: 'manager',
    title: 'Manager',
    icon: <Briefcase className="h-5 w-5" />,
    tagline: 'Full operational access',
    permissions: [
      'Manage rooms',
      'Manage renters',
      'Manage rent',
      'Manage notices',
      'Manage bookings',
      'Edit property data',
    ],
  },
  {
    value: 'viewer',
    title: 'Viewer',
    icon: <Eye className="h-5 w-5" />,
    tagline: 'Read-only access',
    permissions: [
      'View dashboard',
      'View analytics',
      'View occupancy & renters',
      'No editing access',
    ],
  },
];

const RoleSelectionDialog: React.FC<RoleSelectionDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  collaboratorName,
}) => {
  const [selected, setSelected] = useState<CollaboratorRole | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await onConfirm(selected);
      onOpenChange(false);
      setSelected(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[92vw] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Choose role
            {collaboratorName ? <span className="text-muted-foreground"> for {collaboratorName}</span> : null}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Select the level of access for this collaborator.
          </p>
        </DialogHeader>

        <div className="grid gap-3 mt-2">
          {ROLES.map((r) => {
            const isActive = selected === r.value;
            return (
              <motion.button
                key={r.value}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(r.value)}
                className={cn(
                  'w-full text-left rounded-xl border p-4 transition-all',
                  isActive
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/40',
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'h-9 w-9 rounded-full flex items-center justify-center',
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                    )}
                  >
                    {r.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{r.title}</p>
                      {isActive && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{r.tagline}</p>
                    <ul className="mt-2 grid gap-1">
                      {r.permissions.map((p) => (
                        <li key={p} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleConfirm} disabled={!selected || submitting}>
            {submitting ? 'Accepting…' : 'Accept'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoleSelectionDialog;
