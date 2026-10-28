# Full-screen search and intelligent suggestions

- Open an accessible full-screen search over the existing Find Room screen; keep its results, filters, and scroll position mounted. Back cancels draft changes.
- Add an automatically focused search bar, clear action, recent searches stored only on this device, clear history, real Kota locations, and existing accommodation categories.
- Load a small public vocabulary of available listing localities/buildings and hotspots once, cache it, and debounce local suggestion matching. No property downloads or AI requests per keystroke.
- Separate ordinary suggestions from confident spelling corrections. Use normalized text, transposition-aware fuzzy matching, conservative phonetic evidence, and any verified aliases. Preserve type, gender, and budget terms when correcting a location within a longer query.
- Submit each selection once into the existing ranked search flow. Do not change filters, property cards, booking, ranking, or nearby fallback.
- Verify with automated matching/history tests and browser checks for selection, Back, recent history, filters, and a reduced mobile viewport.

## Database and technical details
- Add only a read-only public suggestion-catalog function returning names and kinds from existing public records, with explicit execution grants. No new tables or personal data.
- Reuse the existing dialog and React Router history; a full-screen dialog is exempt from bottom-sheet sizing and tracks the visible viewport above the keyboard.
- Live records include Jawahar Nagar, but no verified “Zavar” alias was found. Do not force that correction; report this limitation unless reliable alias evidence is supplied.
- Browser tests can simulate keyboard-sized viewports, but cannot verify a physical Android keyboard or authenticated booking for this externally managed project.