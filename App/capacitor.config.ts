import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.solarpanel.calculator',
  appName: 'Solar Panel Calculator',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  },
  ios: {
    contentInset: 'automatic'
  }
};

export default config;
