import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import ContextWrapper from './context/ContextWrapper';
import { ErrorBoundary, ContextErrorBoundary, AsyncErrorBoundary } from './components/common';
import errorLogger from './utils/errorLogger';
import globalErrorHandler from './utils/globalErrorHandler';

// Initialize global error handling
globalErrorHandler.init();

const root = ReactDOM.createRoot(document.getElementById('root'));

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
      <ContextErrorBoundary onError={handleContextError}>
        <AsyncErrorBoundary onError={handleAsyncError}>
          <ContextWrapper>
            <App />
          </ContextWrapper>
        </AsyncErrorBoundary>
      </ContextErrorBoundary>
    </ErrorBoundary>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
