
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f44f9031d1bf4d618695911f00d61194',
  appName: 'livenzo-room-finder-hub',
  webDir: 'dist',
  server: {
    url: "https://f44f9031-d1bf-4d61-8695-911f00d61194.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'AAB'
    }
  }
};

export default config;
