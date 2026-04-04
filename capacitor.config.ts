import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.visitaprova.app',
  appName: 'VisitaProva',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic'
  },
  android: {
  }
};

export default config;
