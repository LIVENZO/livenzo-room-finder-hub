
import React from 'react';
import { BadgeCheck, MapPin, CalendarCheck } from 'lucide-react';

const StatCards: React.FC = () => {
  const trustSignals = [
    { icon: BadgeCheck, label: 'Verified listings' },
    { icon: MapPin, label: 'Kota focused' },
    { icon: CalendarCheck, label: 'Free room visits' },
  ];

  return (
    <section aria-label="Why students choose Livenzo" className="mt-5 grid grid-cols-3 gap-2">
      {trustSignals.map(({ icon: Icon, label }) => (
        <div key={label} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card px-2 py-3 text-center shadow-sm">
          <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="text-xs font-medium leading-tight text-foreground">{label}</span>
        </div>
      ))}
    </section>
  );
};

export default StatCards;
