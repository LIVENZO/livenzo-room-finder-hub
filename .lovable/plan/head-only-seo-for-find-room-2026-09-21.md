# Head-only SEO for Find Room

## Changes
- Remove the visible SEO heading, subheading, and introduction from Find Room so its original controls return to their prior position.
- Keep Find Room’s title, description, canonical URL, social metadata, and listing structured data in the document head.
- Preserve room-detail metadata, public indexing, robots rules, and sitemap entries.
- When a room-detail visit is referred by a recognized search engine, send the visitor to `/find-room` instead of the homepage; normal in-app room navigation remains unchanged.

## Validation
- Confirm Find Room has no added visible SEO copy and retains its metadata and canonical URL.
- Confirm ordinary room-card navigation still opens room details.
- Confirm a search-referred room URL lands on Find Room.
- Run the project’s TypeScript check.

## Technical details
- Search-origin detection will use the browser referrer hostname and a constrained list of common search engines. It will not affect direct links, shared links, or internal navigation.
