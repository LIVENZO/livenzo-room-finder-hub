import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface StickySaveBarProps {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
}

/**
 * Sticky "Save Changes" bar that appears while the user is editing
 * (an input/textarea is focused) and there are unsaved changes.
 * Positions itself above the on-screen keyboard using visualViewport.
 */
const StickySaveBar: React.FC<StickySaveBarProps> = ({ dirty, saving, onSave }) => {
  const [inputFocused, setInputFocused] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(0);

  useEffect(() => {
    const isEditable = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
    };
    const onFocusIn = (e: FocusEvent) => {
      if (isEditable(e.target)) setInputFocused(true);
    };
    const onFocusOut = (e: FocusEvent) => {
      if (isEditable(e.target)) {
        // Delay so focus can move to Save button without hiding
        setTimeout(() => {
          const active = document.activeElement;
          if (!isEditable(active)) setInputFocused(false);
        }, 100);
      }
    };
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const offset = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
      setBottomOffset(offset);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  const visible = inputFocused && dirty;

  return (
    <div
      className={`fixed left-0 right-0 z-50 px-4 pt-3 pb-3 bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-4px_16px_rgba(0,0,0,0.08)] transition-all duration-200 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      }`}
      style={{
        bottom: bottomOffset,
        paddingBottom: bottomOffset === 0 ? 'calc(env(safe-area-inset-bottom) + 0.75rem)' : '0.75rem',
      }}
    >
      <Button
        onMouseDown={(e) => e.preventDefault()}
        onClick={onSave}
        disabled={saving || !dirty}
        className="w-full h-12 text-base font-semibold shadow-md"
      >
        {saving ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    </div>
  );
};

export default StickySaveBar;
