import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Plus, Building2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useOwnerProperty } from '@/context/OwnerPropertyContext';
import { cn } from '@/lib/utils';

interface PropertySwitcherProps {
  className?: string;
}

const formatLabel = (name: string, house?: string | null) => {
  if (house && house.trim().length > 0) return `${name} - ${house}`;
  return name;
};

const PropertySwitcher: React.FC<PropertySwitcherProps> = ({ className }) => {
  const navigate = useNavigate();
  const { properties, activeProperty, setActivePropertyId } = useOwnerProperty();
  const [open, setOpen] = useState(false);

  // No properties yet — show a CTA instead of the brand
  if (!activeProperty) {
    return (
      <button
        onClick={() => navigate('/add-property')}
        className={cn(
          'flex items-center gap-1.5 text-primary font-bold text-base truncate',
          className,
        )}
      >
        <Building2 className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">Add property</span>
      </button>
    );
  }

  const label = formatLabel(activeProperty.hostel_pg_name, activeProperty.house_number);
  const hasMultiple = properties.length > 1;

  // Single property — show static label without dropdown affordance
  if (!hasMultiple) {
    return (
      <button
        onClick={() => navigate('/add-property')}
        className={cn(
          'flex items-center gap-1.5 text-primary font-bold text-base truncate min-w-0',
          className,
        )}
        title="Add another property"
      >
        <span className="truncate">{label}</span>
        <Plus className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
      </button>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-1 text-primary font-bold text-base truncate min-w-0 outline-none',
            className,
          )}
        >
          <span className="truncate">{label}</span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-72 max-w-[calc(100vw-32px)] p-2 rounded-2xl shadow-xl border-border/60"
      >
        <AnimatePresence>
          <div className="px-1.5 pt-1 pb-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Your properties
            </p>
          </div>
        </AnimatePresence>

        <div className="space-y-0.5">
          {properties.map((p) => {
            const isActive = p.id === activeProperty.id;
            return (
              <DropdownMenuItem
                key={p.id}
                onSelect={() => setActivePropertyId(p.id)}
                className={cn(
                  'flex items-center gap-3 px-2.5 py-2.5 rounded-xl cursor-pointer focus:bg-accent/60',
                  isActive && 'bg-primary/5',
                )}
              >
                <div
                  className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{p.hostel_pg_name}</p>
                  {p.house_number && (
                    <p className="text-xs text-muted-foreground truncate">
                      House {p.house_number}
                    </p>
                  )}
                </div>
                {isActive && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuItem
          onSelect={() => navigate('/add-property')}
          className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl cursor-pointer focus:bg-accent/60"
        >
          <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary">
            <Plus className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Add new property</p>
            <p className="text-xs text-muted-foreground">Manage another PG or hostel</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PropertySwitcher;
