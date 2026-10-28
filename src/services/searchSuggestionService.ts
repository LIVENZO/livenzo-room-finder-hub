import { supabase } from '@/integrations/supabase/client';
import { SearchTerm } from '@/utils/searchSuggestions';

let cached: { expires: number; terms: SearchTerm[] } | undefined;
let pending: Promise<SearchTerm[]> | undefined;
export function fetchSearchSuggestionCatalog(): Promise<SearchTerm[]> {
  if (cached && cached.expires > Date.now()) return Promise.resolve(cached.terms);
  if (pending) return pending;
  pending = (async () => {
    const { data, error } = await supabase.rpc('get_search_suggestion_catalog');
    if (error) throw error;
    const terms: SearchTerm[] = (data ?? []).flatMap(row =>
      row.kind === 'location' || row.kind === 'building' || row.kind === 'hotspot'
        ? [{ name: row.name, kind: row.kind, listing_count: Number(row.listing_count) }] : []);
    cached = { expires: Date.now() + 5 * 60 * 1000, terms };
    return terms;
  })().finally(() => { pending = undefined; });
  return pending;
}