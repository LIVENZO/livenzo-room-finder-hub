# Referral popup from mobile Share button

## Build
- Replace the mobile bottom navigation’s direct generic share action with a simple referral dialog.
- Show “Refer a Friend”, the exact ₹500 reward message, and a “Share Now” button.
- Generate the signed-in user’s existing referral link only when Share Now is tapped, then open the phone’s native share menu with that link.
- Keep a clipboard fallback when native sharing is unavailable and retain the existing login requirement for personal referral links.
- Update every user-facing referral reward amount and referral earnings calculation from the older values to ₹500.

## Preserve
- Keep all routes, bottom-navigation items, existing referral creation logic, and all unrelated screens unchanged.
- Reuse the shared dialog and button styles so the popup remains above the fixed mobile navigation.

## Verify
- Confirm the Share button opens the popup, its copy is exact, Share Now generates a referral URL, and the native sharing path receives that URL.
- Confirm the app builds without errors.
