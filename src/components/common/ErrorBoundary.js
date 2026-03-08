import React from 'react';
import BaseErrorBoundary from './BaseErrorBoundary';

/**
 * Main error boundary with comprehensive error handling.
 * Wraps BaseErrorBoundary with app-level defaults.
 */
function ErrorBoundary({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  showRetry = true,
  showReload = true,
  fallback,
  onError,
  children,
}) {
  return (
    <BaseErrorBoundary
      title={title}
      message={message}
      showRetry={showRetry}
      showReload={showReload}
      fallback={fallback}
      onError={onError}
    >
      {children}
    </BaseErrorBoundary>
  );
}

export default ErrorBoundary;
