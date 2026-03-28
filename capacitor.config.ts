import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.happytomato.app',
  appName: 'Happy Tomato',
  webDir: 'build',
  // Default Capacitor iOS uses contentInsetAdjustmentBehavior .never, so the page draws under the
  // status bar / Dynamic Island and env(safe-area-inset-*) often stays 0. Automatic insets the WKWebView.
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
