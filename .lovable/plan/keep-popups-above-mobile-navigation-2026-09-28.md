# Keep popups above mobile navigation

## What will change
- Add one shared mobile navigation-safe offset for all bottom sheets and drawers.
- Constrain and vertically reposition modal dialogs within the screen area above the fixed bottom navigation.
- Preserve current desktop positioning, popup content, styling, and behavior.
- Remove the restaurant offer’s one-off offset so it uses the same shared rule as every other popup.

## Technical details
- Mark the fixed bottom navigation and shared popup containers with stable data attributes.
- Apply the 64px navigation height plus device safe-area inset only when the mobile navigation is present.
- Limit popup height and retain internal scrolling so primary actions remain visible and clickable.

## Verification
- Check representative bottom sheets and centered dialogs at a mobile viewport.
- Confirm popup bottoms stop above the navigation and desktop positioning remains unchanged.
- Confirm the preview build has no errors.
