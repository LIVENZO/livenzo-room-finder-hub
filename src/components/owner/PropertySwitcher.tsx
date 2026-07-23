import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Plus, Building2, Trash2, LogOut, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useOwnerProperty, type OwnerProperty } from '@/context/OwnerPropertyContext';
import { supabase } from '@/integrations/supabase/client';
import { fetchMyCollaborations, revokeCollaborator } from '@/services/collaborationService';
import { toast } from 'sonner';
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
  const { properties, activeProperty, setActivePropertyId, refresh } = useOwnerProperty();
  const [open, setOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<OwnerProperty | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const isShared = (p: OwnerProperty) => !!(p.my_role && p.my_role !== 'owner');

  const handleConfirmRemove = async () => {
    if (!pendingRemoval) return;
    setIsRemoving(true);
    try {
      if (isShared(pendingRemoval)) {
        const collabs = await fetchMyCollaborations();
        const mine = collabs.find(
          (c) => c.property_id === pendingRemoval.id && c.i_am === 'collaborator' && c.status === 'accepted',
        );
        if (!mine) throw new Error('Collaboration not found');
        await revokeCollaborator(mine.id);
        toast.success('You have left this property');
      } else {
        const { error } = await supabase
          .from('owner_properties')
          .delete()
          .eq('id', pendingRemoval.id);
        if (error) throw error;
        toast.success('Property deleted');
      }
      setPendingRemoval(null);
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Something went wrong');
    } finally {
      setIsRemoving(false);
    }
  };

  // No properties yet — show a CTA instead of the brand
  if (!activeProperty) {
    return (
      <div className={cn('relative inline-flex items-center', className)}>
        {/* Soft purple glow halo */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -m-1 rounded-full bg-primary/40 blur-lg animate-attention-glow"
        />
        <button
          onClick={() => navigate('/add-property')}
          className={cn(
            'relative inline-flex items-center gap-1.5 text-primary-foreground bg-gradient-to-r from-primary to-primary-600',
            'font-bold text-sm truncate rounded-full px-4 py-2 shadow-large ring-2 ring-primary/40',
            'animate-attention-pulse transition-transform active:scale-95',
          )}
        >
          <Plus className="h-4 w-4 flex-shrink-0" strokeWidth={3} />
          <span className="truncate">Add property</span>
        </button>
      </div>
    );
  }


  const label = formatLabel(activeProperty.hostel_pg_name, activeProperty.house_number);
  const activeIsShared = isShared(activeProperty);

  return (
    <>
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
              const shared = isShared(p);
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
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold truncate">{p.hostel_pg_name}</p>
                      {shared && (
                        <span className="text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary flex-shrink-0">
                          {p.my_role}
                        </span>
                      )}
                    </div>
                    {p.house_number && (
                      <p className="text-xs text-muted-foreground truncate">
                        House {p.house_number}
                      </p>
                    )}
                  </div>
                  {isActive && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpen(false);
                      setPendingRemoval(p);
                    }}
                    aria-label={shared ? 'Leave property' : 'Delete property'}
                    className={cn(
                      'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                      'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
                    )}
                  >
                    {shared ? <LogOut className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                  </button>
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

      <AlertDialog
        open={!!pendingRemoval}
        onOpenChange={(v) => !v && !isRemoving && setPendingRemoval(null)}
      >
        <AlertDialogContent className="max-w-[calc(100vw-32px)] sm:max-w-md rounded-2xl p-6">
          <AlertDialogHeader className="space-y-3">
            <div
              className={cn(
                'h-12 w-12 rounded-2xl flex items-center justify-center mx-auto sm:mx-0',
                'bg-destructive/10 text-destructive',
              )}
            >
              {pendingRemoval && isShared(pendingRemoval) ? (
                <LogOut className="h-6 w-6" />
              ) : (
                <Trash2 className="h-6 w-6" />
              )}
            </div>
            <AlertDialogTitle className="text-center sm:text-left text-lg font-bold">
              {pendingRemoval && isShared(pendingRemoval)
                ? 'Do you really want to leave this role?'
                : 'Do you really want to delete this property?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center sm:text-left text-sm text-muted-foreground">
              {pendingRemoval && isShared(pendingRemoval)
                ? `You will lose access to ${pendingRemoval.hostel_pg_name}. The owner can invite you again later.`
                : `${pendingRemoval?.hostel_pg_name ?? 'This property'} and its data will be removed. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel disabled={isRemoving} className="mt-0 rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isRemoving}
              onClick={(e) => {
                e.preventDefault();
                handleConfirmRemove();
              }}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : pendingRemoval && isShared(pendingRemoval) ? (
                'Leave'
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};


export default PropertySwitcher;
