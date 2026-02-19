import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { parseISO, isPast } from 'date-fns';

const DropScheduleBanner: React.FC = () => {
  const { user } = useAuth();
  const [dropInfo, setDropInfo] = useState<{ date: Date; time: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const { data } = await supabase
        .from('booking_requests')
        .select('drop_date, drop_time, token_paid, status, booking_stage')
        .eq('user_id', user.id)
        .in('status', ['initiated', 'approved'])
        .not('drop_date', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data?.drop_date) return;

      const base = parseISO(data.drop_date);
      if (data.drop_time) {
        const [h, m] = data.drop_time.split(':').map(Number);
        base.setHours(h, m, 0, 0);
      }

      if (isPast(base)) return;

      setDropInfo({ date: base, time: data.drop_time });
    };

    fetch();
  }, [user]);

  // Auto-hide when time passes
  useEffect(() => {
    if (!dropInfo) return;
    const ms = dropInfo.date.getTime() - Date.now();
    if (ms <= 0) { setDropInfo(null); return; }
    const timer = setTimeout(() => setDropInfo(null), ms);
    return () => clearTimeout(timer);
  }, [dropInfo]);

  if (!dropInfo) return null;

  const formattedDate = dropInfo.date.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const formattedTime = dropInfo.time
    ? new Date(`2000-01-01T${dropInfo.time}`).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : null;

  return (
    <div className="flex justify-center mb-4 animate-fade-in">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium shadow-sm">
        <span>🚗</span>
        <span>
          {formattedDate}
          {formattedTime && <> at {formattedTime}</>}
        </span>
      </div>
    </div>
  );
};

export default DropScheduleBanner;
