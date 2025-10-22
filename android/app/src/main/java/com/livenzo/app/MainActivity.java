package com.livenzo.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import com.google.firebase.messaging.FirebaseMessaging;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "LIVENZO_DEBUG";
    public static WebView webViewInstance;
    private FirebaseAuthManager authManager;
    private String notificationData = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Initialize Firebase Auth Manager
        authManager = new FirebaseAuthManager(this);
        
        // Get WebView instance for FCM token handling
        webViewInstance = getBridge().getWebView();
        
        // Add JavaScript interface for FCM token access and Firebase auth
        webViewInstance.addJavascriptInterface(new WebAppInterface(), "Android");
        
        // Check if app was opened via notification
        handleNotificationIntent(getIntent());
        
        // Get FCM token
        FirebaseMessaging.getInstance().getToken()
            .addOnCompleteListener(task -> {
                if (!task.isSuccessful()) {
                    Log.w(TAG, "Fetching FCM registration token failed", task.getException());
                    return;
                }

                // Get new FCM registration token
                String token = task.getResult();
                Log.d(TAG, "FCM Registration Token: " + token);
                
                // Store token in SharedPreferences
                getSharedPreferences("livenzo_prefs", MODE_PRIVATE)
                    .edit()
                    .putString("fcm_token", token)
                    .apply();
                
                // Send token to WebView
                webViewInstance.post(() -> {
                    webViewInstance.evaluateJavascript(
                        "window.dispatchEvent(new CustomEvent('fcmTokenReady', { detail: '" + token + "' }));",
                        null
                    );
                });
                
                // If user is already logged in, sync FCM token with Supabase
                if (authManager.isUserLoggedIn()) {
                    Log.d(TAG, "User already logged in, syncing FCM token");
                    String firebaseUid = authManager.getCurrentUserUID();
                    String phoneNumber = authManager.getCurrentUserPhone();
                    if (firebaseUid != null && phoneNumber != null) {
                        // Update FCM token for logged in user
                        syncFCMTokenOnly(firebaseUid, phoneNumber, token);
                    }
                }
            });
        
        // Check if user is already authenticated
        if (authManager.isUserLoggedIn()) {
            Log.d(TAG, "User is already logged in");
            webViewInstance.post(() -> {
                webViewInstance.evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('userAlreadyLoggedIn', { detail: true }));",
                    null
                );
            });
        }
    }
    
    private void syncFCMTokenOnly(String firebaseUid, String phoneNumber, String fcmToken) {
        new Thread(() -> {
            try {
                org.json.JSONObject payload = new org.json.JSONObject();
                payload.put("firebase_uid", firebaseUid);
                payload.put("phone_number", phoneNumber);
                payload.put("fcm_token", fcmToken);

                java.net.URL url = new java.net.URL("https://naoqigivttgpkfwpzcgg.supabase.co/functions/v1/sync-firebase-user");
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hb3FpZ2l2dHRncGtmd3B6Y2dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzOTQwODIsImV4cCI6MjA2MDk3MDA4Mn0.dd6J5jxbWCRfs7z2C5idDu4z0J6ihnXCnK8d0g7noqw");
                conn.setDoOutput(true);

                java.io.OutputStreamWriter writer = new java.io.OutputStreamWriter(conn.getOutputStream());
                writer.write(payload.toString());
                writer.flush();
                writer.close();

                int responseCode = conn.getResponseCode();
                Log.d(TAG, "FCM token sync response: " + responseCode);
                conn.disconnect();
                
            } catch (Exception e) {
                Log.e(TAG, "Error syncing FCM token", e);
            }
        }).start();
    }

    public class WebAppInterface {
        @JavascriptInterface
        public String getFCMToken() {
            SharedPreferences prefs = getSharedPreferences("livenzo_prefs", MODE_PRIVATE);
            String token = prefs.getString("fcm_token", null);
            Log.d(TAG, "WebView requested FCM token: " + (token != null ? token.substring(0, Math.min(20, token.length())) + "..." : "null"));
            return token;
        }
        
        @JavascriptInterface
        public void log(String message) {
            Log.d(TAG, "WebView Log: " + message);
        }
        
        @JavascriptInterface
        public void sendOTP(String phoneNumber) {
            Log.d(TAG, "Sending OTP to: " + phoneNumber);
            authManager.sendOTP(phoneNumber, MainActivity.this, new FirebaseAuthManager.AuthCallback() {
                @Override
                public void onSuccess(String message) {
                    Log.d(TAG, "OTP sent successfully: " + message);
                    webViewInstance.post(() -> {
                        webViewInstance.evaluateJavascript(
                            "window.dispatchEvent(new CustomEvent('otpSent', { detail: '" + message + "' }));",
                            null
                        );
                    });
                }

                @Override
                public void onError(String error) {
                    Log.e(TAG, "OTP sending failed: " + error);
                    webViewInstance.post(() -> {
                        webViewInstance.evaluateJavascript(
                            "window.dispatchEvent(new CustomEvent('otpError', { detail: '" + error + "' }));",
                            null
                        );
                    });
                }
            });
        }
        
        @JavascriptInterface
        public void verifyOTP(String otp) {
            Log.d(TAG, "Verifying OTP: " + otp);
            authManager.verifyOTP(otp, new FirebaseAuthManager.AuthCallback() {
                @Override
                public void onSuccess(String message) {
                    Log.d(TAG, "OTP verification successful: " + message);
                    webViewInstance.post(() -> {
                        webViewInstance.evaluateJavascript(
                            "window.dispatchEvent(new CustomEvent('otpVerified', { detail: '" + message + "' }));",
                            null
                        );
                    });
                }

                @Override
                public void onError(String error) {
                    Log.e(TAG, "OTP verification failed: " + error);
                    webViewInstance.post(() -> {
                        webViewInstance.evaluateJavascript(
                            "window.dispatchEvent(new CustomEvent('otpVerificationError', { detail: '" + error + "' }));",
                            null
                        );
                    });
                }
            });
        }
        
        @JavascriptInterface
        public boolean isUserLoggedIn() {
            return authManager.isUserLoggedIn();
        }
        
        @JavascriptInterface
        public void signOut() {
            authManager.signOut();
            webViewInstance.post(() -> {
                webViewInstance.evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('userSignedOut', { detail: true }));",
                    null
                );
            });
        }
        
        @JavascriptInterface
        public String getCurrentUserUID() {
            return authManager.getCurrentUserUID();
        }
        
        @JavascriptInterface
        public String getNotificationData() {
            return notificationData;
        }
        
        @JavascriptInterface
        public void clearNotificationData() {
            notificationData = null;
        }
    }
    
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleNotificationIntent(intent);
    }
    
    private void handleNotificationIntent(Intent intent) {
        if (intent != null && intent.getExtras() != null) {
            Bundle extras = intent.getExtras();
            
            // Check if this intent has notification data
            if (extras.containsKey("type")) {
                try {
                    JSONObject notificationJson = new JSONObject();
                    
                    // Add all extras to JSON
                    for (String key : extras.keySet()) {
                        Object value = extras.get(key);
                        if (value != null) {
                            notificationJson.put(key, value.toString());
                        }
                    }
                    
                    notificationData = notificationJson.toString();
                    Log.d(TAG, "Notification data received: " + notificationData);
                    
                    // If WebView is ready, send notification tap event
                    if (webViewInstance != null) {
                        webViewInstance.post(() -> {
                            webViewInstance.evaluateJavascript(
                                "window.dispatchEvent(new CustomEvent('notificationTapped', { detail: " + notificationData + " }));",
                                null
                            );
                        });
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error handling notification intent", e);
                }
            }
        }
    }
}