import React from 'react';
import { PropertyTypeFilter as PropertyTypeFilterValue } from '@/types/room';
import { cn } from '@/lib/utils';

const OPTIONS: { label: string; value: PropertyTypeFilterValue }[] = [
  { label: 'All', value: 'all' },
  { label: 'PG', value: 'PG' },
  { label: 'Hostel', value: 'Hostel' },
  { label: 'BHK', value: 'BHK' },
];

interface Props {
  value: PropertyTypeFilterValue;
  onChange: (value: PropertyTypeFilterValue) => void;
}

const PropertyTypeFilter: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="grid grid-cols-4 gap-2 pb-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'w-full px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all text-center',
            value === opt.value
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-background text-foreground border-border hover:border-primary/40'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

export default PropertyTypeFilter;
