# Livenzo User Intelligence — Step 1: behaviour tracking

## What gets built
One small, isolated event log that records 7 moments per user (or per anonymous visitor), without changing any existing screen, button, search, booking, payment or login logic.

Events:
1. search_submitted — query, category, hotspot / near-me used, filters (no free text beyond the query itself)
2. property_viewed — room detail page actually opened and visible for at least 2 seconds (not rooms merely fetched/listed)
3. property_saved — only when a save succeeds (not on unsave)
4. book_visit_tapped
5. book_room_tapped
6. visit_request_submitted — fires only after the existing visit flow reports success
7. booking_enquiry_submitted — fires only after the existing booking_requests insert succeeds

Each row: event type, room/property ID, user ID (if signed in) or an anonymous session ID, timestamp, small search-context object (last query + category that led to the room). No phone numbers, names, messages, locations or device details.

## Reused systems
- Existing `search_logs` / `property_clicks` logging stays untouched and keeps working; its debounce + duplicate-skip approach is reused.
- Existing anonymous installation ID pattern (`livenzo_installation_id`) reused as the anonymous session identifier.
- Existing Supabase client and session lookup reused. No AI, no external platform, no notifications.

## New database table (necessary)
`search_logs` and `property_clicks` cannot hold event types, views, saves or bookings without rewriting them, which is forbidden. So one new append-only table `user_behaviour_events`:
- Insert only; clients cannot read, update or delete (owner of data analysis via service role / SQL).
- Signed-in inserts must use their own user ID; anonymous inserts must have a null user ID plus a session ID.
- Size limits on text and context fields; index on (user_id, created_at) and (room_id, event_type).
- No changes to any existing table or policy.

## Duplicate protection
- Client: in-memory + sessionStorage key per (event, room, ~30s window); view counted once per room per page visit.
- Search: reuse existing 500ms debounce and identical-query skip.
- Database: unique idempotency key column so retried sends are ignored.

## Failure isolation
- Single fire-and-forget `trackBehaviour()` call added beside existing handlers, wrapped in try/catch, never awaited by the UI, never throws.
- If the table, network or session fails, nothing in the app changes.

## Files touched
- New: `src/services/BehaviourTrackingService.ts`, its unit test, one migration.
- One-line additions only in: `FindRoom.tsx` (search), `RoomDetail.tsx` (view), `RoomCard.tsx` + `useRoomDetail.ts` (save success), `StickyBottomBar.tsx` + `RoomActionCard.tsx` (taps), `BookVisitDialog.tsx` (visit success), `BookingFlowSheet.tsx` (booking success).

## Testing
- Unit tests: dedupe window, view-once rule, no-throw on failure, anonymous vs signed-in payload, no sensitive fields.
- Database: direct anonymous insert works, insert with someone else's user ID is rejected, client reads are rejected.
- Browser (mobile size): perform each of the 7 actions, confirm one row each and that the existing flows behave identically; repeat with tracking blocked to confirm app still works.
- Limitation: signed-in end-to-end checks can't be driven from my side on this project; signed-in events are verified with simulated sessions and database policy tests.

## Rollback
Remove the one-line calls and drop the new table; nothing else depends on it.

Nothing is published; you review results before deploying.
