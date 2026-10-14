import { Hotspot } from '@/services/HotspotService';
import { PropertyTypeFilter, RoomFilters } from '@/types/room';

export interface SearchIntent {
  normalizedQuery: string;
  propertyType?: Exclude<PropertyTypeFilter, 'all'>;
  gender?: 'male' | 'female';
  maxPrice?: number;
  roomType?: 'single' | 'sharing';
  wifi?: boolean;
  bathroom?: boolean;
  coolingType?: 'ac' | 'cooler';
  food?: 'included' | 'not_included';
  affordable: boolean;
  locationQuery?: string;
  hotspot?: Hotspot;
}

export interface ResolvedSearchFilters {
  filters: RoomFilters;
  conflict: boolean;
}

const normalizeText = (value: string) => value
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[^a-z0-9₹\s-]/g, ' ')
  .replace(/\bhostle\b|\bhostal\b|\bhostels\b/g, 'hostel')
  .replace(/\bp(?:[.\s-]*g)(?:[.\s-]*s)?\b/g, 'pg')
  .replace(/\bboy'?s?\b|\bladka\b|\bladke\b|\bladko\b|\bmale\b/g, 'boys')
  .replace(/\bgirl'?s?\b|\bladki\b|\bladkiyo\b|\bfemale\b/g, 'girls')
  .replace(/\bflats?\b|\bapartments?\b/g, 'bhk')
  .replace(/\bsasta\b|\bbudget friendly\b|\blow cost\b/g, 'cheap')
  .replace(/\bnearby\b|\bpaas\b/g, 'near')
  .replace(/\s+/g, ' ')
  .trim();

const phraseIncludes = (query: string, phrases: string[]) =>
  phrases.some((phrase) => new RegExp(`(^|\\s)${phrase.replace(/ /g, '\\s+')}($|\\s)`).test(query));

const findHotspot = (query: string, hotspots: Hotspot[]) => {
  const words = query.split(' ');
  return hotspots
    .map((hotspot) => {
      const name = normalizeText(hotspot.name);
      const exact = query.includes(name);
      const nameWords = name.split(' ');
      const overlap = nameWords.filter((word) => words.some((queryWord) => queryWord.startsWith(word) || word.startsWith(queryWord))).length;
      return { hotspot, exact, overlap, wordCount: nameWords.length };
    })
    .filter((candidate) => candidate.exact || candidate.overlap === candidate.wordCount)
    .sort((a, b) => Number(b.exact) - Number(a.exact) || b.overlap - a.overlap)[0]?.hotspot;
};

const extractBudget = (query: string) => {
  const match = query.match(/(?:under|below|upto|up to|less than|max(?:imum)?|budget(?: of)?|ke under)\s*₹?\s*(\d{3,6})\b/);
  if (match?.[1]) return Number(match[1]);
  const reverseMatch = query.match(/₹?\s*(\d{3,6})\s*(?:or less|tak)\b/);
  return reverseMatch?.[1] ? Number(reverseMatch[1]) : undefined;
};

const removeIntentTerms = (query: string, hotspot?: Hotspot) => {
  let remainder = query;
  if (hotspot) remainder = remainder.replace(normalizeText(hotspot.name), ' ');
  return remainder
    .replace(/\b(hostel|pg|bhk|room|rooms|accommodation|property|properties|rent|rental)\b/g, ' ')
    .replace(/\b(boys|girls|student|students|male|female)\b/g, ' ')
    .replace(/\b(for|in|at|near|around|close|to|with|and|me|my|a|an|the)\b/g, ' ')
    .replace(/\b(cheap|premium|best|affordable|single|sharing|wifi|wi-fi|bathroom|attached|ac|cooler|food|mess|included)\b/g, ' ')
    .replace(/(?:under|below|upto|up to|less than|max(?:imum)?|budget(?: of)?|ke under)\s*₹?\s*\d{3,6}\b/g, ' ')
    .replace(/₹?\s*\d{3,6}\s*(?:or less|tak)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const parseSearchIntent = (rawQuery: string, hotspots: Hotspot[] = []): SearchIntent => {
  const normalizedQuery = normalizeText(rawQuery);
  const hotspot = findHotspot(normalizedQuery, hotspots);
  const propertyType = phraseIncludes(normalizedQuery, ['hostel'])
    ? 'Hostel'
    : phraseIncludes(normalizedQuery, ['pg', 'paying guest'])
      ? 'PG'
      : phraseIncludes(normalizedQuery, ['bhk', '1 rk', '1bhk', '2bhk', '3bhk'])
        ? 'BHK'
        : undefined;
  const gender = phraseIncludes(normalizedQuery, ['boys'])
    ? 'male'
    : phraseIncludes(normalizedQuery, ['girls'])
      ? 'female'
      : undefined;
  const roomType = phraseIncludes(normalizedQuery, ['single', 'private room'])
    ? 'single'
    : phraseIncludes(normalizedQuery, ['sharing', 'shared room', 'double sharing', 'triple sharing'])
      ? 'sharing'
      : undefined;
  const coolingType = phraseIncludes(normalizedQuery, ['ac', 'air conditioned'])
    ? 'ac'
    : phraseIncludes(normalizedQuery, ['cooler'])
      ? 'cooler'
      : undefined;
  const remainingLocation = removeIntentTerms(normalizedQuery, hotspot);
  const locationQuery = hotspot?.name ?? (remainingLocation || undefined);

  return {
    normalizedQuery,
    propertyType,
    gender,
    maxPrice: extractBudget(normalizedQuery),
    roomType,
    wifi: phraseIncludes(normalizedQuery, ['wifi', 'wi-fi']) || undefined,
    bathroom: phraseIncludes(normalizedQuery, ['attached bathroom', 'personal bathroom']) || undefined,
    coolingType,
    food: phraseIncludes(normalizedQuery, ['food included', 'with food', 'with mess']) ? 'included' : undefined,
    affordable: phraseIncludes(normalizedQuery, ['cheap', 'affordable']),
    locationQuery,
    hotspot,
  };
};

export const resolveSearchFilters = (intent: SearchIntent, manual: RoomFilters): ResolvedSearchFilters => {
  const manualType = manual.propertyType && manual.propertyType !== 'all' ? manual.propertyType : undefined;
  const conflict = Boolean(
    (intent.propertyType && manualType && intent.propertyType !== manualType)
    || (intent.gender && manual.gender && intent.gender !== manual.gender)
    || (intent.roomType && manual.roomType && intent.roomType !== manual.roomType)
    || (intent.coolingType && manual.coolingType && intent.coolingType !== manual.coolingType)
  );

  return {
    conflict,
    filters: {
      ...manual,
      propertyType: intent.propertyType ?? manual.propertyType,
      gender: intent.gender ?? manual.gender,
      maxPrice: intent.maxPrice == null
        ? manual.maxPrice
        : manual.maxPrice == null
          ? intent.maxPrice
          : Math.min(intent.maxPrice, manual.maxPrice),
      roomType: intent.roomType ?? manual.roomType,
      wifi: intent.wifi ?? manual.wifi,
      bathroom: intent.bathroom ?? manual.bathroom,
      coolingType: intent.coolingType ?? manual.coolingType,
      food: intent.food ?? manual.food,
    },
  };
};