# Project architecture decisions

- Mobile bottom-navigation actions use React Router state to trigger existing Find Room search and Near Me controls without duplicating routes or filter logic.
- Mobile referral sharing reuses the shared WhatsApp referral action, so referral link and message generation stay centralized.
- Restaurant offer redemptions are created only by an authenticated Edge Function and keyed by a hashed installation identifier because account identity alone cannot enforce one claim per device.
- Shared bottom-sheet, drawer, and dialog primitives reserve the mobile bottom-navigation height so every popup action remains visible and clickable.
- Natural-language room search uses one public ranked database function with explicit type, suitability, and budget constraints applied before relevance scoring, so hard requirements cannot be overridden by text matches.
- Full-screen search keeps Find Room mounted using a router-history overlay; drafts submit once to the existing search flow, and name-only suggestions are cached from an invoker-RLS catalog with local device history to avoid per-keystroke property requests and personal-data collection.