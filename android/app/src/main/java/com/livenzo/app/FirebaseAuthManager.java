package com.livenzo.app;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.PhoneAuthCredential;
import com.google.firebase.auth.PhoneAuthOptions;
import com.google.firebase.auth.PhoneAuthProvider;
import com.google.firebase.messaging.FirebaseMessaging;
import org.json.JSONObject;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.TimeUnit;

public class FirebaseAuthManager {
    private static final String TAG = "LIVENZO_AUTH";
    private static final String SUPABASE_URL = "https://naoqigivttgpkfwpzcgg.supabase.co";
    private static final String SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hb3FpZ2l2dHRncGtmd3B6Y2dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzOTQwODIsImV4cCI6MjA2MDk3MDA4Mn0.dd6J5jxbWCRfs7z2C5idDu4z0J6ihnXCnK8d0g7noqw";
    
    private FirebaseAuth mAuth;
    private Context context;
    private String verificationId;
    private PhoneAuthProvider.ForceResendingToken resendToken;
    
    public interface AuthCallback {
        void onSuccess(String message);
        void onError(String error);
    }

    public FirebaseAuthManager(Context context) {
        this.context = context;
        this.mAuth = FirebaseAuth.getInstance();
    }

    public void sendOTP(String phoneNumber, Activity activity, AuthCallback callback) {
        PhoneAuthOptions options = PhoneAuthOptions.newBuilder(mAuth)
                .setPhoneNumber(phoneNumber)
                .setTimeout(60L, TimeUnit.SECONDS)
                .setActivity(activity)
                .setCallbacks(new PhoneAuthProvider.OnVerificationStateChangedCallbacks() {
                    @Override
                    public void onVerificationCompleted(PhoneAuthCredential credential) {
                        Log.d(TAG, "Verification completed automatically");
                        signInWithCredential(credential, callback);
                    }

                    @Override
                    public void onVerificationFailed(Exception e) {
                        Log.e(TAG, "Verification failed: " + e.getMessage());
                        callback.onError("OTP verification failed: " + e.getMessage());
                    }

                    @Override
                    public void onCodeSent(String verificationId, PhoneAuthProvider.ForceResendingToken token) {
                        Log.d(TAG, "OTP sent successfully");
                        FirebaseAuthManager.this.verificationId = verificationId;
                        FirebaseAuthManager.this.resendToken = token;
                        callback.onSuccess("OTP sent successfully");
                    }
                })
                .build();
        
        PhoneAuthProvider.verifyPhoneNumber(options);
    }

    public void verifyOTP(String otp, AuthCallback callback) {
        if (verificationId == null) {
            callback.onError("Verification ID not found. Please request OTP again.");
            return;
        }

        PhoneAuthCredential credential = PhoneAuthProvider.getCredential(verificationId, otp);
        signInWithCredential(credential, callback);
    }

    private void signInWithCredential(PhoneAuthCredential credential, AuthCallback callback) {
        mAuth.signInWithCredential(credential)
                .addOnCompleteListener(task -> {
                    if (task.isSuccessful()) {
                        Log.d(TAG, "Firebase authentication successful");
                        FirebaseUser user = mAuth.getCurrentUser();
                        if (user != null) {
                            syncUserDataWithSupabase(user, callback);
                        } else {
                            callback.onError("User not found after authentication");
                        }
                    } else {
                        Log.e(TAG, "Firebase authentication failed", task.getException());
                        callback.onError("OTP verification failed: " + 
                            (task.getException() != null ? task.getException().getMessage() : "Unknown error"));
                    }
                });
    }

    private void syncUserDataWithSupabase(FirebaseUser user, AuthCallback callback) {
        // Get FCM token
        FirebaseMessaging.getInstance().getToken()
                .addOnCompleteListener(task -> {
                    if (!task.isSuccessful()) {
                        Log.w(TAG, "Fetching FCM registration token failed", task.getException());
                        // Continue without FCM token
                        performSupabaseSync(user.getUid(), user.getPhoneNumber(), null, callback);
                        return;
                    }

                    String fcmToken = task.getResult();
                    Log.d(TAG, "FCM Token: " + fcmToken);
                    
                    // Sync with Supabase
                    performSupabaseSync(user.getUid(), user.getPhoneNumber(), fcmToken, callback);
                });
    }

    private void performSupabaseSync(String firebaseUid, String phoneNumber, String fcmToken, AuthCallback callback) {
        new Thread(() -> {
            try {
                // Create JSON payload
                JSONObject payload = new JSONObject();
                payload.put("firebase_uid", firebaseUid);
                payload.put("phone", phoneNumber);
                if (fcmToken != null) {
                    payload.put("fcm_token", fcmToken);
                }

                // Make HTTP request to Supabase
                URL url = new URL(SUPABASE_URL + "/rest/v1/user_profiles");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("apikey", SUPABASE_ANON_KEY);
                conn.setRequestProperty("Authorization", "Bearer " + SUPABASE_ANON_KEY);
                conn.setRequestProperty("Prefer", "resolution=merge-duplicates");
                conn.setDoOutput(true);

                // Send data
                OutputStreamWriter writer = new OutputStreamWriter(conn.getOutputStream());
                writer.write(payload.toString());
                writer.flush();
                writer.close();

                int responseCode = conn.getResponseCode();
                Log.d(TAG, "Supabase sync response code: " + responseCode);

                if (responseCode >= 200 && responseCode < 300) {
                    // Store auth data locally
                    SharedPreferences prefs = context.getSharedPreferences("livenzo_auth", Context.MODE_PRIVATE);
                    prefs.edit()
                            .putString("firebase_uid", firebaseUid)
                            .putString("phone_number", phoneNumber)
                            .putString("fcm_token", fcmToken)
                            .putBoolean("is_logged_in", true)
                            .apply();

                    Log.d(TAG, "User data synced successfully with Supabase");
                    callback.onSuccess("Authentication successful! User data synced.");
                } else {
                    Log.e(TAG, "Failed to sync with Supabase. Response code: " + responseCode);
                    callback.onError("Failed to sync user data with server");
                }
                
                conn.disconnect();
                
            } catch (Exception e) {
                Log.e(TAG, "Error syncing with Supabase", e);
                callback.onError("Failed to sync user data: " + e.getMessage());
            }
        }).start();
    }

    public boolean isUserLoggedIn() {
        FirebaseUser currentUser = mAuth.getCurrentUser();
        SharedPreferences prefs = context.getSharedPreferences("livenzo_auth", Context.MODE_PRIVATE);
        boolean localAuth = prefs.getBoolean("is_logged_in", false);
        return currentUser != null && localAuth;
    }

    public void signOut() {
        mAuth.signOut();
        SharedPreferences prefs = context.getSharedPreferences("livenzo_auth", Context.MODE_PRIVATE);
        prefs.edit().clear().apply();
        Log.d(TAG, "User signed out successfully");
    }

    public String getCurrentUserUID() {
        FirebaseUser user = mAuth.getCurrentUser();
        return user != null ? user.getUid() : null;
    }

    public String getCurrentUserPhone() {
        FirebaseUser user = mAuth.getCurrentUser();
        return user != null ? user.getPhoneNumber() : null;
    }
}