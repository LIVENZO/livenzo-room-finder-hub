# Restaurant discount offer

## What will be built
- Add a premium 10% restaurant offer banner above the renter profile content only.
- Open a focused redemption screen from the banner without changing existing profile features.
- Validate the bill amount, generate a unique coupon, and show both the coupon and exact 10% savings.
- Show “Offer already redeemed on this device.” when that installation has already claimed the offer.

## Secure redemption
- Store redemptions in a private Supabase table that browsers cannot read or write directly.
- Redeem through a protected Edge Function that validates the signed-in renter, validates the bill amount, hashes the installation identifier, and atomically enforces one redemption per device.
- Associate the redemption with the current user for auditing, while enforcing uniqueness by device rather than phone number or account.

## Technical details
- Use Capacitor’s installation identifier on supported installed apps, with a persistent generated browser identifier as the web fallback.
- Return only the coupon code, bill amount, discount amount, and redemption status from the server endpoint.
- Use the existing Livenzo tokens, controls, and animation patterns so the rest of the profile stays unchanged.

## Verification
- Confirm a renter can redeem once and sees the correct 10% calculation.
- Confirm a second attempt from the same installation returns the already-redeemed message, including after account switching.
- Confirm owners do not see the offer and the existing profile controls remain intact.