import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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

    setIsSwitching(true);
    try {
      const { error: roleError } = await supabase
        .from('user_role_assignments')
        .upsert(
          {
            user_id: user.id,
            role: 'owner',
            email: (user as any).email ?? null,
            phone: (user as any).phone ?? null,
          },
          { onConflict: 'user_id' }
        );

      if (roleError) throw roleError;

      const { data: properties } = await supabase
        .from('owner_properties')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);

      localStorage.setItem('userRole', 'owner');
      onNavigate?.();

      // Full reload so every consumer picks up the new role cleanly.
      window.location.href = properties && properties.length > 0 ? '/dashboard' : '/add-property';
    } catch (error) {
      console.error('Failed to switch to owner mode:', error);
      toast.error('Could not switch to Owner mode. Please try again.');
      setIsSwitching(false);
    }
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
