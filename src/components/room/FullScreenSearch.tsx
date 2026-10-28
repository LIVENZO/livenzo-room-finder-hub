import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogPortal, DialogOverlay, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowUpLeft, Clock3, MapPin, Search, X, Loader2, Building2 } from 'lucide-react';
import { fetchSearchSuggestionCatalog } from '@/services/searchSuggestionService';
import { SearchTerm, getSearchSuggestions, accommodationTerms, readRecentSearches, rememberSearch, RECENT_SEARCH_KEY } from '@/utils/searchSuggestions';
import { Hotspot } from '@/services/HotspotService';

interface Props {
  open: boolean;
  initialQuery: string;
  hotspots: Hotspot[];
  onClose: () => void;
  onSearch: (query: string) => void;
}

const FullScreenSearch = ({ open, initialQuery, hotspots, onClose, onSearch }: Props) => {
  const [draft, setDraft] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);
  const [history, setHistory] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<SearchTerm[]>([]);
  const [loading, setLoading] = useState(false);
  const [catalogError, setCatalogError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    submittedRef.current = false;
    setDraft(initialQuery);
    setDebounced(initialQuery);
    try { setHistory(readRecentSearches(window.localStorage)); } catch { setHistory([]); }
    let cancelled = false;
    setLoading(true);
    setCatalogError(false);
    fetchSearchSuggestionCatalog().then(terms => {
      if (!cancelled) setCatalog(terms);
    }).catch(() => { if (!cancelled) setCatalogError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(draft), 200);
    return () => window.clearTimeout(timer);
  }, [draft]);

  useEffect(() => {
    if (!open) return;
    const viewport = window.visualViewport;
    const update = () => {
      if (!panelRef.current) return;
      panelRef.current.style.setProperty('--search-visible-height', `${viewport?.height ?? window.innerHeight}px`);
      panelRef.current.style.setProperty('--search-visible-top', `${viewport?.offsetTop ?? 0}px`);
    };
    update();
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    return () => {
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
    };
  }, [open]);

  const terms = useMemo(() => catalog.length ? catalog : hotspots.map(h => ({ name: h.name, kind: 'hotspot' as const })), [catalog, hotspots]);
  const suggestions = useMemo(() => getSearchSuggestions(debounced, terms), [debounced, terms]);
  const corrections = suggestions.filter(s => s.correction);
  const ordinary = suggestions.filter(s => !s.correction);
  const submit = (query: string) => {
    if (submittedRef.current || !query.trim()) return;
    submittedRef.current = true;
    const clean = query.trim().slice(0, 160);
    setDraft(clean);
    const next = rememberSearch(clean, history);
    setHistory(next);
    try { window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next)); } catch { /* Device storage may be unavailable. */ }
    inputRef.current?.blur();
    onSearch(clean);
  };
  const clearHistory = () => {
    setHistory([]);
    try { window.localStorage.removeItem(RECENT_SEARCH_KEY); } catch { /* Still clear current UI. */ }
  };
  const row = (label: string, query: string, kind: SearchTerm['kind'], key = query) => (
    <Button key={key} variant="ghost" className="h-auto min-h-12 w-full justify-start gap-3 rounded-none px-1 py-3 text-left font-normal" onClick={() => submit(query)}>
      {kind === 'category' ? <Search className="h-4 w-4 shrink-0 text-primary" /> : kind === 'building' ? <Building2 className="h-4 w-4 shrink-0 text-primary" /> : <MapPin className="h-4 w-4 shrink-0 text-primary" />}
      <span className="min-w-0 flex-1 whitespace-normal break-words">{label}</span>
      <ArrowUpLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Button>
  );

  return <Dialog open={open} onOpenChange={value => { if (!value) onClose(); }}>
    <DialogPortal>
      <DialogOverlay className="z-[100] bg-background" />
      <DialogPrimitive.Content ref={panelRef} aria-describedby={undefined} className="full-screen-search fixed inset-x-0 z-[101] flex flex-col bg-background text-foreground"
        onOpenAutoFocus={event => { event.preventDefault(); inputRef.current?.focus({ preventScroll: true }); }}
        onCloseAutoFocus={event => event.preventDefault()}>
        <DialogTitle className="sr-only">Search Livenzo</DialogTitle>
        <header className="shrink-0 border-b border-border px-3 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <form className="mx-auto flex max-w-3xl items-center gap-2" onSubmit={event => { event.preventDefault(); submit(draft); }}>
            <Button type="button" variant="ghost" size="icon" aria-label="Back to results" onClick={onClose} className="shrink-0"><ArrowLeft className="h-5 w-5" /></Button>
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input ref={inputRef} aria-label="Search locations and accommodation" type="search" enterKeyHint="search" autoComplete="off" maxLength={160}
                placeholder="Search Kota, PGs, hostels…" value={draft} onChange={event => setDraft(event.target.value)} className="h-11 pl-10 pr-10 text-base" />
              {draft && <Button type="button" variant="ghost" size="icon" aria-label="Clear search text" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2" onClick={() => { setDraft(''); setDebounced(''); inputRef.current?.focus(); }}><X className="h-4 w-4" /></Button>}
            </div>
          </form>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(1rem+env(safe-area-inset-bottom))]" aria-live="polite">
          <div className="mx-auto max-w-3xl py-4">
            {!draft.trim() ? <>
              {history.length > 0 && <section className="mb-6">
                <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Recent searches</h2><Button variant="ghost" size="sm" onClick={clearHistory}>Clear history</Button></div>
                {history.map(query => <Button key={query} variant="ghost" className="h-auto min-h-12 w-full justify-start gap-3 rounded-none px-1 py-3 text-left font-normal" onClick={() => submit(query)}><Clock3 className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="whitespace-normal break-words">{query}</span></Button>)}
              </section>}
              <section className="mb-6"><h2 className="mb-2 text-sm font-semibold">Accommodation</h2>{accommodationTerms.slice(0, 3).map(term => row(term.name, term.name, term.kind))}</section>
              <section><h2 className="mb-2 text-sm font-semibold">Popular Kota locations</h2>{terms.filter(t => t.kind === 'location' || t.kind === 'hotspot').slice(0, 6).map(term => row(term.name, term.name, term.kind))}</section>
            </> : <>
              {draft === debounced && corrections.length > 0 && <section className="mb-4 border-b border-border pb-3"><h2 className="mb-1 text-sm font-semibold text-primary">Did you mean?</h2>{corrections.map(s => row(s.label, s.query, s.kind, `correction:${s.query}`))}</section>}
              <section><h2 className="mb-1 text-sm font-semibold">Search suggestions</h2>
                {row(`Search for “${draft}”`, draft, 'category', 'original-query')}
                {draft === debounced && ordinary.map(s => row(s.label, s.query, s.kind))}
              </section>
            </>}
            {loading && <div role="status" aria-label="Loading suggestions" className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
            {catalogError && <p className="mt-3 text-sm text-muted-foreground">Location suggestions are temporarily unavailable. You can still search.</p>}
          </div>
        </div>
      </DialogPrimitive.Content>
    </DialogPortal>
  </Dialog>;
};
export default FullScreenSearch;