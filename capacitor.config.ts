import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.remon.pokemonlaneclash',
  appName: 'Pokemon Lane Clash',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  android: { allowMixedContent: false, backgroundColor: '#071419' }
};
export default config;
