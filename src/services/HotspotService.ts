
import { supabase } from '@/integrations/supabase/client';

export interface Hotspot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  city: string | null;
}

let cachedHotspots: Hotspot[] | null = null;

export const fetchHotspots = async (): Promise<Hotspot[]> => {
  if (cachedHotspots) return cachedHotspots;

  const { data, error } = await supabase
    .from('hotspots')
    .select('id, name, latitude, longitude, city');

  if (error) {
    console.error('Error fetching hotspots:', error);
    return [];
  }

  cachedHotspots = (data || []).map(h => ({
    id: h.id,
    name: h.name,
    latitude: Number(h.latitude),
    longitude: Number(h.longitude),
    city: h.city,
  }));

  return cachedHotspots;
};

// Fuzzy match: checks if query is a substring of hotspot name or vice versa
export const findMatchingHotspot = (query: string, hotspots: Hotspot[]): Hotspot | null => {
  const q = query.toLowerCase().trim();
  if (!q || q.length < 3) return null;

  // Strip "near" prefix if present
  const cleaned = q.replace(/^near\s+/i, '').trim();
  if (cleaned.length < 3) return null;

  // 1. Exact match
  const exact = hotspots.find(h => h.name.toLowerCase() === cleaned);
  if (exact) return exact;

  // 2. Hotspot name starts with query
  const startsWith = hotspots.find(h => h.name.toLowerCase().startsWith(cleaned));
  if (startsWith) return startsWith;

  // 3. Query contains hotspot name or hotspot name contains query
  const contains = hotspots.find(h => {
    const hName = h.name.toLowerCase();
    return hName.includes(cleaned) || cleaned.includes(hName);
  });
  if (contains) return contains;

  // 4. Simple fuzzy: check if all words in query appear in hotspot name
  const queryWords = cleaned.split(/\s+/);
  const fuzzy = hotspots.find(h => {
    const hName = h.name.toLowerCase();
    return queryWords.every(w => hName.includes(w));
  });

  return fuzzy || null;
};

// Get suggestion hotspots matching partial input
export const getHotspotSuggestions = (query: string, hotspots: Hotspot[]): Hotspot[] => {
  const q = query.toLowerCase().trim().replace(/^near\s+/i, '').trim();
  if (!q || q.length < 2) return [];

  return hotspots.filter(h => {
    const hName = h.name.toLowerCase();
    return hName.includes(q) || q.split(/\s+/).every(w => hName.includes(w));
  }).slice(0, 5);
};
