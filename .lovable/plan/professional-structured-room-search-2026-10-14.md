# Professional structured room search

## Goal
Upgrade the existing Find Room search without changing Livenzo’s layout, cards, navigation, booking flow, public visibility, or existing manual filters. Natural-language searches will resolve to real room fields and rank eligible listings instead of requiring title/location text matches.

## What the audit found
- Public listings come from `rooms` through `get_public_room_listings()` and include the real fields needed: `property_type`, `facilities` JSON (`gender`, `roomType`, Wi-Fi, bathroom, cooling, food), rent fields, locality/building text, coordinates, availability, media, and top-room status.
- The current search downloads the public catalog, then requires the whole query to appear in `title` or `location`. A query such as “hostel for boys” therefore misses valid male hostels whose titles omit that phrase.
- Hotspot fallback only runs after zero text matches, strips only a leading “near”, uses a fixed 2 km cutoff, and does not parse type, gender, budget, amenities, spelling variants, or Hinglish intent.
- The database has coordinate and hotspot-name indexes, but no room text/trigram indexes and no structured ranked search function.

## Implementation
1. **Parse search intent deterministically**
   - Add a small tested search-intent utility for property type, gender, maximum budget, room type, amenities, affordability terms, locality/landmark text, common synonyms, singular/plural forms, partial/common misspellings, and supported Hinglish terms.
   - Treat explicit property type, gender, budget, and manual filters as hard constraints. Detect conflicting explicit/manual constraints and return no unrelated listings.

2. **Add one efficient public Supabase search function**
   - Add `pg_trgm`-backed indexes for available listings’ searchable text and structured filter expressions.
   - Add a public, read-only ranked-search RPC over the existing `rooms` and `hotspots` data. It will return the same safe listing fields as the current public RPC, continue masking owner phone details, and exclude unavailable rooms.
   - Apply hard constraints before scoring. Score exact locality/hotspot matches, geographic proximity when coordinates exist, normalized text/property-name relevance, listing completeness/media, affordability, and current top-room quality signals.
   - Keep the current public RLS/visibility behavior and grants; no new tables or invented listing columns.

3. **Integrate without redesigning the screen**
   - Keep the current initial room loading, property cards, filters, PG/Hostel pricing override behavior, Near Me flow, analytics, and detail navigation.
   - Use the ranked RPC only when a text query is active; debounce requests, ignore stale responses, and show the existing loading spinner while searching.
   - Preserve explicit sidebar/pill filters and near-me ordering. Keep the full catalog state used by room details separate from search results.

4. **Fallback and messages**
   - If strict ranked search has no results, retry only by relaxing non-essential free text and expanding a recognized location to nearby results; never relax property type, gender, budget, or applied filters.
   - Add a compact in-flow message when nearby/relaxed results are shown.
   - Improve the existing empty-state copy with useful alternatives based on the parsed request, without inventing listings.

5. **Verification**
   - Add focused parser/filter tests for every required query and concrete hard-filter rules.
   - Run the required queries against actual Supabase listings and verify returned rows satisfy explicit type, gender, budget, and availability constraints.
   - Verify typo/synonym searches work when titles do not contain the full query, location searches rank exact/nearby records appropriately, and fallback does not create fake matches.
   - Check the live Find Room flow, existing filters, Near Me, loading state, room navigation, and current build health.

## Technical details
- Expected files: `src/utils/searchIntent.ts` plus tests, `src/services/roomFetchService.ts`, `src/context/RoomContext.tsx`, `src/hooks/useRoomFilters.ts`, `src/types/room.ts`, `src/pages/FindRoom.tsx`, and the existing results/empty-state presentation as needed.
- Database changes will be a backward-compatible migration containing indexes and a new RPC; the existing public listing RPC remains available.
- No AI API call will be made per search.
