import { parseSearchIntent } from '@/utils/searchIntent';

export interface SearchTerm {
  name: string;
  kind: 'location' | 'hotspot' | 'building' | 'category';
  listing_count?: number;
  // Only aliases verified by the data owner belong here.
  verifiedAliases?: string[];
}
export interface SearchSuggestion {
  label: string;
  query: string;
  kind: SearchTerm['kind'];
  correction: boolean;
  score: number;
}
export const normalizeSuggestionText = (text: string) => text.normalize('NFKC').toLowerCase()
  .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

// Optimal-string-alignment distance includes adjacent character transpositions.
export const spellingDistance = (a: string, b: string): number => {
  const d = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) d[i][0] = i;
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + Number(a[i - 1] !== b[j - 1]));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
      d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
};
const phoneticKey = (value: string) => value.replace(/ph/g, 'f').replace(/sh/g, 's')
  .replace(/[aeiou]/g, '').replace(/(.)\1+/g, '$1');
export const accommodationTerms: SearchTerm[] = [
  { name: 'Hostel', kind: 'category', verifiedAliases: ['hostle', 'hostal', 'hostels'] },
  { name: 'PG', kind: 'category', verifiedAliases: ['paying guest'] },
  { name: 'BHK', kind: 'category', verifiedAliases: ['flat', 'flats', 'apartment'] },
  { name: 'Boys hostel', kind: 'category' },
  { name: 'Girls hostel', kind: 'category' },
  { name: 'PG for boys', kind: 'category' },
];

export function getSearchSuggestions(raw: string, catalog: SearchTerm[]): SearchSuggestion[] {
  const normalized = normalizeSuggestionText(raw);
  if (normalized.length < 2 || normalized.length > 160) return [];
  const intent = parseSearchIntent(raw);
  const segment = normalizeSuggestionText(intent.locationQuery ?? normalized);
  const results: SearchSuggestion[] = [];
  for (const term of [...catalog, ...accommodationTerms]) {
    const name = normalizeSuggestionText(term.name);
    const isCategory = term.kind === 'category';
    const needle = isCategory ? normalized : segment;
    if (!needle || needle.length < 2) continue;
    const alias = term.verifiedAliases?.some(a => normalizeSuggestionText(a) === needle);
    const partial = name.includes(needle) || needle.split(' ').every(w => name.split(' ').some(n => n.startsWith(w)));
    const nameWords = name.split(' ');
    const needleWords = needle.split(' ');
    // Match a missing locality suffix without losing multi-word landmark context.
    const target = needleWords.length === 1 ? nameWords[0] : name;
    const distance = spellingDistance(needle, target);
    const ratio = 1 - distance / Math.max(needle.length, target.length);
    const phonetic = needle.length >= 4 && phoneticKey(needle) === phoneticKey(target);
    const fuzzy = needle.length >= 4 && distance <= (needle.length >= 8 ? 2 : 1)
      && (ratio >= 0.75 || (phonetic && ratio >= 0.65));
    if (!alias && !partial && !fuzzy) continue;
    const correction = Boolean(alias || (!partial && fuzzy));
    const query = !isCategory && intent.locationQuery
      ? intent.normalizedQuery.replace(intent.locationQuery, term.name)
      : term.name;
    results.push({ label: term.name, query, kind: term.kind, correction,
      score: alias ? 100 : name === needle ? 99 : partial ? 90 : 70 + ratio * 10 + Number(phonetic) });
  }
  // Accommodation typos already understood by the existing intent parser.
  if (/\b(hostle|hostal)\b/i.test(raw)) {
    results.push({ label: raw.replace(/\b(hostle|hostal)\b/gi, 'hostel'),
      query: raw.replace(/\b(hostle|hostal)\b/gi, 'hostel'), kind: 'category', correction: true, score: 100 });
  }
  const ordered = results.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
  const bestCorrection = ordered.find(s => s.correction);
  const ambiguous = bestCorrection && ordered.some(s => s.correction && normalizeSuggestionText(s.label) !== normalizeSuggestionText(bestCorrection.label)
    && Math.abs(s.score - bestCorrection.score) < 2);
  const seen = new Set<string>();
  return ordered.filter(s => {
    if (s.correction && ambiguous) return false;
    const key = normalizeSuggestionText(s.query);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 8);
}

export const RECENT_SEARCH_KEY = 'livenzo_recent_searches';
export function readRecentSearches(storage: Pick<Storage, 'getItem'>): string[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(RECENT_SEARCH_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string' && s.trim().length > 0 && s.length <= 160).slice(0, 8) : [];
  } catch { return []; }
}
export function rememberSearch(query: string, history: string[]): string[] {
  const trimmed = query.trim().slice(0, 160);
  if (!trimmed) return history;
  return [trimmed, ...history.filter(s => normalizeSuggestionText(s) !== normalizeSuggestionText(trimmed))].slice(0, 8);
}