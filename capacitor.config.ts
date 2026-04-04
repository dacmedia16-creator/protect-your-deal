import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.visitaprova.app',
  appName: 'VisitaProva',
  webDir: 'dist',
  server: {
    url: 'https://07e88add-a325-447d-b38e-594f428f36b6.lovableproject.com?forceHideBadge=true',
  },
  ios: {
    contentInset: 'automatic'
  },
  android: {
  }
};

export default config;
