import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

/**
 * Opens an external URL. Uses Capacitor Browser plugin in native apps
 * (where window.open is blocked by WebView), falls back to window.open on web.
 */
export const openExternalUrl = async (url: string) => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Browser.open({ url });
    } catch (e) {
      // Fallback: try window.location for intent-style URLs
      window.location.href = url;
    }
  } else {
    window.open(url, '_blank');
  }
};
