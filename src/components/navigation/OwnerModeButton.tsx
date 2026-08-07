import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { useAuth } from '@/context/auth';

interface OwnerModeButtonProps {
  className?: string;
  label?: string;
  onNavigate?: () => void;
}

/**
 * Switches the current user into Owner mode.
 * - If the user already has properties, opens the owner dashboard.
 * - Otherwise opens owner onboarding (Add Property).
 */
const OwnerModeButton: React.FC<OwnerModeButtonProps> = ({ className, label = 'Owner Mode', onNavigate }) => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitch = async () => {
    if (isSwitching) return;

    // Already in owner mode — just open the dashboard.
    if (userRole === 'owner') {
      onNavigate?.();
      navigate('/dashboard');
      return;
    }

    if (!user?.id) {
      toast.error('Please sign in first');
      return;
    }

    // Do NOT switch the role yet — the user must first add and save a property.
    onNavigate?.();
    navigate('/add-property?switchToOwner=1');
  };


  return (
    <Button
      variant="ghost"
      className={cn('justify-start gap-3', className)}
      onClick={handleSwitch}
      disabled={isSwitching}
    >
      {isSwitching ? <Loader2 size={20} className="animate-spin" /> : <Building2 size={20} />}
      <span className="font-display font-medium">{label}</span>
    </Button>
  );
};

export default OwnerModeButton;
