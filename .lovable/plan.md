# Reuse WhatsApp referral sharing

## Change
- Update the referral popup’s “Share Now” action to call the existing `shareOnWhatsApp` referral function.
- Reuse its current referral link and WhatsApp message without introducing another sharing path.
- Keep the popup copy, styling, loading state, and all unrelated behavior unchanged.

## Verify
- Confirm “Share Now” invokes the same WhatsApp URL generation used by the existing “Share on WhatsApp” button.
- Confirm the app builds without errors.
