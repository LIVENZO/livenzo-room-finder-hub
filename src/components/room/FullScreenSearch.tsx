import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogPortal, DialogOverlay, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowUpLeft, Clock3, MapPin, Search, X, Loader2, Building2 } from 'lucide-react';
import { fetchSearchSuggestionCatalog } from '@/services/searchSuggestionService';
import { SearchTerm, getSearchSuggestions, accommodationTerms, readRecentSearches, rememberSearch, RECENT_SEARCH_KEY, normalizeSuggestionText, rankCategoryMatches } from '@/utils/searchSuggestions';
import { Hotspot, getHotspotSuggestions } from '@/services/HotspotService';

interface Props {
  open: boolean;
  initialQuery: string;
  hotspots: Hotspot[];
  onClose: () => void;
  onSearch: (query: string) => void;
  onHotspotSelect?: (hotspot: Hotspot) => void;
}

const FullScreenSearch = ({ open, initialQuery, hotspots, onClose, onSearch, onHotspotSelect }: Props) => {
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
  type HotspotItem = { name: string; hotspot?: Hotspot; weight: number };
  const hotspotMatches = useMemo(() => {
    const items: HotspotItem[] = [
      ...hotspots.map(h => ({ name: h.name, hotspot: h, weight: 0 })),
    ];
    const legacy = debounced.trim() ? new Set(getHotspotSuggestions(debounced, hotspots).map(h => h.id)) : new Set<string>();
    return rankCategoryMatches(debounced, items, i => i.name, 4, i => (i.hotspot && legacy.has(i.hotspot.id) ? 60 : i.weight));
  }, [debounced, hotspots, catalog]);
  const locationMatches = useMemo(() => rankCategoryMatches(debounced, catalog.filter(t => t.kind === 'location'), t => t.name, 4, t => Number(t.listing_count ?? 0)), [debounced, catalog]);
  const propertyMatches = useMemo(() => {
    const taken = new Set([...hotspotMatches, ...locationMatches].map(i => normalizeSuggestionText(i.name)));
    return rankCategoryMatches(debounced, catalog.filter(t => t.kind === 'building' && !taken.has(normalizeSuggestionText(t.name))), t => t.name, 4, t => Number(t.listing_count ?? 0), true);
  }, [debounced, catalog, hotspotMatches, locationMatches]);
  const listedHotspotNames = useMemo(() => new Set([...hotspotMatches, ...locationMatches, ...propertyMatches].map(i => normalizeSuggestionText(i.name))), [hotspotMatches, locationMatches, propertyMatches]);
  const ordinary = suggestions.filter(s => !s.correction && !listedHotspotNames.has(normalizeSuggestionText(s.query)) && !listedHotspotNames.has(normalizeSuggestionText(s.label)));
  const box = (tag: string, children: React.ReactNode) => (
    <section className="mb-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center border-b border-border bg-muted/40 px-3 py-2"><h2 className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-primary">{tag}</h2></div>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
  const boxRow = (key: string, label: string, Icon: typeof MapPin, onClick: () => void) => (
    <Button key={key} variant="ghost" className="h-auto min-h-11 w-full justify-start gap-3 rounded-none px-3 py-2.5 text-left font-normal" onClick={onClick}>
      <Icon className="h-4 w-4 shrink-0 text-primary" /><span className="min-w-0 flex-1 whitespace-normal break-words">{label}</span>
    </Button>
  );
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
            {hotspotMatches.length > 0 && box('HOTSPOT', hotspotMatches.map(item => boxRow(`h:${item.name}`, item.name, item.hotspot ? MapPin : Building2, () => { if (item.hotspot) onHotspotSelect?.(item.hotspot); else submit(item.name); })))}
            {locationMatches.length > 0 && box('LOCATION', locationMatches.map(term => boxRow(`l:${term.name}`, term.name, MapPin, () => submit(term.name))))}
            {propertyMatches.length > 0 && box('HOSTEL / PROPERTY', propertyMatches.map(term => boxRow(`p:${term.name}`, term.name, Building2, () => submit(term.name))))}
            {!draft.trim() ? <>
              {history.length > 0 && <section className="mb-6">
                <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Recent searches</h2><Button variant="ghost" size="sm" onClick={clearHistory}>Clear history</Button></div>
                {history.map(query => <Button key={query} variant="ghost" className="h-auto min-h-12 w-full justify-start gap-3 rounded-none px-1 py-3 text-left font-normal" onClick={() => submit(query)}><Clock3 className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="whitespace-normal break-words">{query}</span></Button>)}
              </section>}
              <section className="mb-6"><h2 className="mb-2 text-sm font-semibold">Popular Kota locations</h2>{terms.filter(t => t.kind === 'location' || t.kind === 'hotspot').slice(0, 6).map(term => row(term.name, term.name, term.kind))}</section>
              <section><h2 className="mb-2 text-sm font-semibold">Accommodation</h2>{accommodationTerms.slice(0, 3).map(term => row(term.name, term.name, term.kind))}</section>
            </> : <>
              {draft === debounced && corrections.some(s => !listedHotspotNames.has(normalizeSuggestionText(s.label))) && <section className="mb-4 border-b border-border pb-3"><h2 className="mb-1 text-sm font-semibold text-primary">Did you mean?</h2>{corrections.filter(s => !listedHotspotNames.has(normalizeSuggestionText(s.label))).map(s => row(s.label, s.query, s.kind, `correction:${s.query}`))}</section>}
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