/**
 * Opens WhatsApp with the given URL, using intent-based deep linking
 * that works inside Android WebView / Capacitor.
 */
export function openWhatsApp(url: string) {
  // Try intent:// scheme for Android WebView first
  const intentUrl = url
    .replace('https://wa.me/', 'intent://send/')
    .replace(/\?/, '#Intent;scheme=whatsapp;package=com.whatsapp;action=android.intent.action.SEND;end;?');

  // Detect if running inside a Capacitor / WebView environment
  const isCapacitor = !!(window as any).Capacitor;
  const isAndroidWebView =
    /wv/.test(navigator.userAgent) ||
    /Android/.test(navigator.userAgent);

  if (isCapacitor || isAndroidWebView) {
    // Force navigation via location.href so Android resolves the intent
    window.location.href = url;
    // Fallback: if location.href didn't trigger in 300ms, try intent://
    setTimeout(() => {
      try {
        window.location.href = intentUrl;
      } catch {
        // last resort
        window.open(url, '_system');
      }
    }, 300);
  } else {
    window.open(url, '_blank');
  }
}
