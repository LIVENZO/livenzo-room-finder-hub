package com.livenzo.app;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "LIVENZO_DEBUG";
    public static WebView webViewInstance;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Get WebView instance for FCM token handling
        webViewInstance = getBridge().getWebView();
        
        // Add JavaScript interface for FCM token access
        webViewInstance.addJavascriptInterface(new WebAppInterface(), "Android");
        
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
            });
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
    }
}