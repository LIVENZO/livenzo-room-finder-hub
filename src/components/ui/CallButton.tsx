
import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

interface CallButtonProps {
  phoneNumber: string;
  label?: string;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const CallButton: React.FC<CallButtonProps> = ({
  phoneNumber,
  label = 'Call',
  variant = 'outline',
  size = 'default',
  className = ''
}) => {
  const isMobile = useIsMobile();

  const handleCall = () => {
    if (!isMobile) {
      toast.error('Calling is only available on mobile devices');
      return;
    }

    // Format phone number for tel: link (remove any formatting)
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    window.location.href = `tel:${cleanNumber}`;
    toast.success('Opening phone dialer...');
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCall}
      disabled={!isMobile}
      className={`${className} ${!isMobile ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={!isMobile ? 'Calling is only available on mobile devices' : `Call ${phoneNumber}`}
    >
      <Phone className="h-4 w-4 mr-2" />
      {label}
      {!isMobile && <span className="ml-2 text-xs">(Mobile only)</span>}
    </Button>
  );
};

export default CallButton;
