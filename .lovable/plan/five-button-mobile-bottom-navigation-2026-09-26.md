# Five-button mobile bottom navigation

## Build
- Add a fixed mobile-only bottom navigation to the existing shared layout with Home, Search, Share, Near Me, and Profile.
- Route Home to the public room listings, Search to the same page with the existing search field focused, Near Me to the same page with the existing location search activated, and Profile to the existing profile page.
- Use the device’s native share menu for Share, with a browser-safe fallback when native sharing is unavailable.
- Highlight the active destination in Livenzo’s existing purple theme and preserve safe-area spacing.

## Preserve
- Keep the desktop sidebar, mobile top bar, homepage, room cards, owner-only access, and all existing business logic unchanged.
- Reuse the current room search and Near Me behavior rather than creating duplicate pages or filters.

## Verify
- Check mobile navigation, active states, search focus, Near Me activation, sharing fallback, and profile navigation.
- Confirm desktop layout remains unchanged and the app builds without errors.

## Technical details
- Create one focused navigation component using existing Button, routing, icons, and semantic color tokens.
- Pass one-time navigation intent through router state so Search and Near Me trigger existing controls without persistent URL side effects.
- Keep enough bottom content spacing for the fixed bar and device safe area.
