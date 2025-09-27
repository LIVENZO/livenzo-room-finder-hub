# Firebase + Supabase Authentication Integration

## Overview
This integration allows users to sign in with phone number + OTP via Firebase, then automatically creates/syncs them with Supabase and returns valid session tokens.

## How It Works

1. User enters phone number and receives OTP via Firebase
2. App verifies OTP with Firebase 
3. App calls `sync-firebase-user` edge function with Firebase UID and phone number
4. Edge function:
   - Creates fake email (`{phone_without_plus}@livenzo.app`) for Supabase compatibility
   - Creates or updates Supabase user with phone and fake email
   - Generates valid session tokens using admin API
   - Returns `access_token` and `refresh_token`

## Mobile App Integration

### 1. After Firebase OTP Verification
```javascript
// After successful Firebase OTP verification
const response = await supabase.functions.invoke('sync-firebase-user', {
  body: {
    firebase_uid: firebaseUser.uid,
    phone_number: firebaseUser.phoneNumber, // e.g., "+917488698975"
    fcm_token: fcmToken // optional
  }
});

if (response.data?.success) {
  const { access_token, refresh_token } = response.data;
  
  // Set the Supabase session
  await supabase.auth.setSession({
    access_token,
    refresh_token
  });
  
  // User is now logged in to both Firebase and Supabase
  console.log('User synced successfully:', response.data.supabase_user_id);
}
```

### 2. Session Management
```javascript
// Check if user is logged in
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  // User is logged in, can access RLS-protected tables
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .single();
}

// Sign out
await supabase.auth.signOut();
```

## Key Features

- ✅ **Seamless UX**: Users only see phone + OTP, never the fake email
- ✅ **Production Ready**: Handles existing users and new signups
- ✅ **RLS Compatible**: Returns valid tokens for accessing protected tables  
- ✅ **FCM Support**: Optionally syncs FCM tokens for push notifications
- ✅ **Error Handling**: Comprehensive error handling and logging

## Generated Email Format
- Input: `+917488698975`
- Generated Email: `917488698975@livenzo.app`
- Users never see this email, it's only for Supabase internal requirements

## Testing
1. Use Firebase phone auth to verify a phone number
2. Call the sync function with the Firebase UID and phone
3. Verify the returned tokens work for Supabase queries
4. Check that user can access RLS-protected tables