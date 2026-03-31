/// <reference types="@capacitor-firebase/messaging" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.happytomato.app',
  appName: 'Happy Tomato',
  webDir: 'build',
  // 'automatic' adjusts WKWebView scroll insets and often leaves a blank band under the web content.
  // 'never' lets the document fill the webview; use CSS env(safe-area-inset-*) (viewport-fit=cover).
  ios: {
    contentInset: 'never',
  },
  plugins: {
    FirebaseMessaging: {
      presentationOptions: ['alert', 'badge', 'sound'],
    },
  },
};

export default config;
