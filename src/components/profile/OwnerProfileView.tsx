import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BadgeCheck,
  Phone,
  Copy,
  QrCode,
  Pencil,
  Mail,
  FileText,
  ShieldCheck,
  IdCard,
} from 'lucide-react';
import { UserProfile } from '@/services/UserProfileService';
import { User } from '@supabase/supabase-js';
import { useOwnerProperty } from '@/context/OwnerPropertyContext';
import { toast } from 'sonner';
import OwnerQRModal from '@/components/relationship/OwnerQRModal';

interface OwnerProfileViewProps {
  profile: UserProfile | null;
  user: User | null;
  formValues: {
    fullName: string;
    phone: string;
    bio: string;
    roomNumber: string;
  };
  onEdit: () => void;
}

const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  action?: React.ReactNode;
}> = ({ icon, label, value, action }) => (
  <div className="flex items-center gap-3 py-3">
    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </p>
      <p className="text-sm font-semibold text-foreground truncate">
        {value || <span className="text-muted-foreground/60 italic">Not set</span>}
      </p>
    </div>
    {action}
  </div>
);

const OwnerProfileView: React.FC<OwnerProfileViewProps> = ({
  profile,
  user,
  formValues,
  onEdit,
}) => {
  const { activeProperty, properties } = useOwnerProperty();
  const [qrOpen, setQrOpen] = useState(false);
  const hasProperty = properties.length > 0;

  const displayPublicId = activeProperty?.public_id || profile?.public_id || '';
  const propertyLabel = activeProperty
    ? `${activeProperty.hostel_pg_name}${activeProperty.house_number ? ` · House ${activeProperty.house_number}` : ''}`
    : null;

  const avatarUrl = profile?.avatar_url
    ? profile.avatar_url.includes('?')
      ? profile.avatar_url
      : `${profile.avatar_url}?t=${Date.now()}`
    : '';

  const initial =
    formValues.fullName?.charAt(0).toUpperCase() ||
    user?.email?.charAt(0).toUpperCase() ||
    'O';

  const copyPublicId = () => {
    if (!displayPublicId) return;
    navigator.clipboard.writeText(displayPublicId);
    toast.success('Owner ID copied');
  };

  return (
    <div className="space-y-4">
      {/* Premium Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/15 via-primary/5 to-background shadow-sm">
        <div className="absolute inset-0 pointer-events-none opacity-70 [background:radial-gradient(120%_80%_at_100%_0%,hsl(var(--primary)/0.2),transparent_60%)]" />
        <div className="relative px-6 pt-7 pb-6 flex flex-col items-center text-center">
          <div className="relative">
            <Avatar className="h-24 w-24 ring-4 ring-background shadow-xl">
              <AvatarImage src={avatarUrl} className="object-cover" />
              <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-primary/25 to-secondary/30">
                {initial}
              </AvatarFallback>
            </Avatar>
            {hasProperty && (
              <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-background border-2 border-background shadow-md flex items-center justify-center">
                <BadgeCheck className="h-6 w-6 text-primary fill-primary/15" />
              </div>
            )}
          </div>

          <div className="mt-4 space-y-1">
            <h1 className="text-[22px] font-bold text-foreground leading-tight">
              {formValues.fullName || 'Your Name'}
            </h1>
            {hasProperty && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-primary font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified Owner
              </div>
            )}
            {propertyLabel && (
              <p className="text-sm text-muted-foreground pt-0.5">{propertyLabel}</p>
            )}
          </div>

          {formValues.phone && (
            <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-background/70 backdrop-blur border border-border/60 text-sm text-foreground">
              <Phone className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">{formValues.phone}</span>
            </div>
          )}

          <Button
            onClick={onEdit}
            variant="outline"
            className="mt-5 h-10 px-5 rounded-full border-primary/25 bg-background/70 backdrop-blur hover:bg-primary/5 font-semibold text-sm"
          >
            <Pencil className="h-3.5 w-3.5 mr-2" />
            Edit Profile
          </Button>
        </div>
      </section>

      {/* Owner ID Card */}
      {hasProperty && displayPublicId && (
        <section className="rounded-2xl bg-card border border-border/60 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <IdCard className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Your Owner ID</p>
              <p className="text-xs text-muted-foreground">
                Share to let renters connect instantly
              </p>
            </div>
          </div>
          <div className="px-5 pb-5">
            <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15 px-4 py-4 mb-3">
              <p className="font-mono text-xl tracking-[0.25em] text-center font-bold text-foreground">
                {displayPublicId}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="outline"
                onClick={copyPublicId}
                className="h-11 rounded-xl border-border/70 font-semibold"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                onClick={() => setQrOpen(true)}
                className="h-11 rounded-xl font-semibold shadow-sm"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Show QR
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* About / Contact */}
      <section className="rounded-2xl bg-card border border-border/60 shadow-sm px-5 py-2 divide-y divide-border/50">
        <InfoRow
          icon={<Phone className="h-4 w-4 text-primary" />}
          label="Phone"
          value={formValues.phone}
        />
        {user?.email && (
          <InfoRow
            icon={<Mail className="h-4 w-4 text-primary" />}
            label="Email"
            value={user.email}
          />
        )}
        <InfoRow
          icon={<FileText className="h-4 w-4 text-primary" />}
          label="About"
          value={formValues.bio}
        />
      </section>

      <OwnerQRModal open={qrOpen} onOpenChange={setQrOpen} publicId={displayPublicId} />
    </div>
  );
};

export default OwnerProfileView;
