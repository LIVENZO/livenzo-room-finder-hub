import { supabase } from "@/integrations/supabase/client";

const RECENT_SEARCHES_KEY = "livenzo_recent_searches";
const MAX_RECENT_SEARCHES = 10;

let searchDebounceTimer: NodeJS.Timeout | null = null;
let lastLoggedQuery = "";

interface SearchLogData {
  searchQuery: string;
  selectedCategory?: string;
  nearMeUsed?: boolean;
  hotspotUsed?: string | null;
  filters?: Record<string, unknown>;
}

/**
 * Log a search event with 500ms debounce to prevent spam.
 */
export const logSearch = (data: SearchLogData) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);

  searchDebounceTimer = setTimeout(async () => {
    const query = data.searchQuery.trim();

    // Skip empty or duplicate consecutive searches
    if (!query && !data.nearMeUsed && !data.hotspotUsed) return;
    if (query === lastLoggedQuery && !data.nearMeUsed && !data.hotspotUsed) return;

    lastLoggedQuery = query;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id ?? null;

      await (supabase as any).from("search_logs").insert({
        user_id: userId,
        search_query: query,
        selected_category: data.selectedCategory ?? "all",
        near_me_used: data.nearMeUsed ?? false,
        hotspot_used: data.hotspotUsed ?? null,
        filters: data.filters ?? {},
      });

      // Save to recent searches locally
      if (query) saveRecentSearch(query);
    } catch {
      // Fail silently
    }
  }, 500);
};

/**
 * Log a property/room card click.
 */
export const logPropertyClick = async (
  propertyId: string,
  searchQuery = "",
  selectedCategory = "all",
  source = "search"
) => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id ?? null;

    await (supabase as any).from("property_clicks").insert({
      user_id: userId,
      property_id: propertyId,
      search_query: searchQuery,
      selected_category: selectedCategory,
      source,
    });
  } catch {
    // Fail silently
  }
};

/**
 * Save a search query to local recent searches.
 */
const saveRecentSearch = (query: string) => {
  try {
    const existing = getRecentSearches();
    const filtered = existing.filter((s) => s.toLowerCase() !== query.toLowerCase());
    filtered.unshift(query);
    const trimmed = filtered.slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(trimmed));
  } catch {
    // Fail silently
  }
};

/**
 * Get recent searches from local storage.
 */
export const getRecentSearches = (): string[] => {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Clear recent searches.
 */
export const clearRecentSearches = () => {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
};
