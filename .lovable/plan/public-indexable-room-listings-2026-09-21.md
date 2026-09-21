# Public, indexable room listings

## Goal
Make the room search page and every available PG, hostel, and room detail page usable without signing in, while keeping the owner dashboard and owner-only actions private.

## Changes
- Remove the sign-in redirect from public room browsing and load safe room data for signed-out visitors.
- Add a tightly scoped public database function that returns only available listing fields and never exposes owner contact details or private owner data.
- Keep favorite, contact, booking, dashboard, editing, and owner-management actions behind sign-in checks.
- Generate sitemap entries for every currently available room URL, alongside the public room-search page; omit unavailable/private listings and unreliable `lastmod` values.
- Preserve the existing robots rules that allow Google and point to the sitemap.

## Validation
- Test `/find-room` and a `/room/:id` page in a signed-out browser.
- Confirm `/dashboard` still redirects signed-out visitors.
- Confirm the sitemap contains public listing URLs and no private owner routes.
- Run the project’s TypeScript checks.

## Technical details
- Public reads will use a safe `SECURITY DEFINER` SQL function with an explicit return shape, fixed `search_path`, availability filter, and execute grants for `anon` and `authenticated`.
- Existing authenticated room reads and owner write paths remain unchanged.
- The sitemap generator will query the same public listing source during build and fall back safely to static public routes if the listing service is temporarily unavailable.
