# Project architecture decisions

- Mobile bottom-navigation actions commit route state synchronously and eagerly trigger same-screen controls, preserving shared Find Room logic without perceived tap delay.
- Mobile referral sharing reuses the shared WhatsApp referral action, so referral link and message generation stay centralized.
- Restaurant offer redemptions are created only by an authenticated Edge Function and keyed by a hashed installation identifier because account identity alone cannot enforce one claim per device.
- Shared bottom-sheet, drawer, and dialog primitives reserve the mobile bottom-navigation height so every popup action remains visible and clickable.