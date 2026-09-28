# Project architecture decisions

- Mobile bottom-navigation actions use React Router state to trigger existing Find Room search and Near Me controls without duplicating routes or filter logic.
- Restaurant offer redemptions are created only by an authenticated Edge Function and keyed by a hashed installation identifier because account identity alone cannot enforce one claim per device.
- Shared bottom-sheet, drawer, and dialog primitives reserve the mobile bottom-navigation height so every popup action remains visible and clickable.