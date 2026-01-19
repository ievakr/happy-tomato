import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import ContextWrapper from './context/ContextWrapper';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary, ContextErrorBoundary, AsyncErrorBoundary } from './components/common';
import errorLogger from './utils/errorLogger';
import globalErrorHandler from './utils/globalErrorHandler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { register as registerServiceWorker } from './serviceWorkerRegistration';

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
    key: 'happy-tomato-react-query'
  });

  persistQueryClient({
    queryClient,
    persister,
    maxAge: 1000 * 60 * 60 * 24
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
    </ErrorBoundary>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
registerServiceWorker();