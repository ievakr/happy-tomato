import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import '@fontsource/open-sans/400.css';
import '@fontsource/open-sans/600.css';
import '@fontsource/open-sans/700.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/material-icons-outlined/400.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/variables.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './index.css';
import './styles/event-items.css';
import './styles/calendar-views.css';
import './styles/legacy.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import ContextWrapper from './context/ContextWrapper';
import { LanguageProvider } from './i18n/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary, ContextErrorBoundary, AsyncErrorBoundary } from './components/common';
import errorLogger from './utils/errorLogger';
import globalErrorHandler from './utils/globalErrorHandler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { register as registerServiceWorker } from './serviceWorkerRegistration';

// Native iOS: mark html + fix shell height. Bootstrap vh-100 uses 100vh, which on WKWebView is often
// taller than the visible area, so the bottom of the flex layout is clipped past the home indicator.
// With ios.contentInset "automatic", visualViewport.height can be *shorter* than the laid-out webview,
// leaving a blank band at the bottom — use the larger of layout vs visual viewport.
function syncCapacitorIosViewportHeight() {
  const inner = Math.round(window.innerHeight);
  const vv = window.visualViewport;
  const visual = vv ? Math.round(vv.height) : inner;
  const h = Math.max(inner, visual);
  document.documentElement.style.setProperty('--app-vh', `${h}px`);
}

if (
  typeof document !== 'undefined' &&
  Capacitor.isNativePlatform() &&
  Capacitor.getPlatform() === 'ios'
) {
  document.documentElement.classList.add('capacitor-ios-native');
  syncCapacitorIosViewportHeight();
  // Layout / safe area can settle after first paint (esp. after contentInset config changes).
  requestAnimationFrame(() => {
    syncCapacitorIosViewportHeight();
    setTimeout(syncCapacitorIosViewportHeight, 100);
    setTimeout(syncCapacitorIosViewportHeight, 300);
  });
  window.addEventListener('resize', syncCapacitorIosViewportHeight);
  window.addEventListener('orientationchange', syncCapacitorIosViewportHeight);
  window.addEventListener('load', syncCapacitorIosViewportHeight);
  window.addEventListener('pageshow', syncCapacitorIosViewportHeight);
  window.visualViewport?.addEventListener('resize', syncCapacitorIosViewportHeight);
}

function initGoogleTagManager() {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-TS72DX4R';
  document.head.appendChild(s);
}

function injectFlaticonUiconsStylesheet() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href =
    'https://cdn-uicons.flaticon.com/2.6.0/uicons-regular-rounded/css/uicons-regular-rounded.css';
  document.head.appendChild(link);
}

// Web only: GTM loads third-party scripts; WKWebView reports their failures as opaque "Script error."
if (!Capacitor.isNativePlatform()) {
  initGoogleTagManager();
}

injectFlaticonUiconsStylesheet();

// Initialize global error handling
globalErrorHandler.init();

const root = ReactDOM.createRoot(document.getElementById('root'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false
    }
  }
});

if (typeof window !== 'undefined') {
  const persister = createSyncStoragePersister({
    storage: window.localStorage,
    key: 'happy-tomato-react-query-v2',
  });

  persistQueryClient({
    queryClient,
    persister,
    maxAge: 1000 * 60 * 60 * 24,
    dehydrateOptions: {
      shouldDehydrateQuery: (q) => q.queryKey[0] !== 'events',
    },
  });
}

const handleGlobalError = (error, errorInfo) => {
  errorLogger.logError(error, errorInfo, 'Global Error Boundary');
};

const handleContextError = (error, errorInfo) => {
  errorLogger.logError(error, errorInfo, 'Context Error Boundary');
};

const handleAsyncError = (error, errorInfo) => {
  errorLogger.logError(error, errorInfo, 'Async Error Boundary');
};

root.render(
  <React.StrictMode>
    <ErrorBoundary
      title="Calendar App Error"
      message="The calendar application has encountered a critical error."
      onError={handleGlobalError}
    >
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AuthProvider>
              <ContextErrorBoundary onError={handleContextError}>
                <AsyncErrorBoundary onError={handleAsyncError}>
                  <ContextWrapper>
                    <App />
                  </ContextWrapper>
                </AsyncErrorBoundary>
              </ContextErrorBoundary>
            </AuthProvider>
          </ToastProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
if (!Capacitor.isNativePlatform()) {
  registerServiceWorker();
}