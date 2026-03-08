import React from 'react';
import BaseErrorBoundary from './BaseErrorBoundary';

/**
 * Error boundary for async operations (Firebase, network).
 * Shows connection-focused messaging and retry.
 */
function AsyncErrorBoundary({ onError, children }) {
  return (
    <BaseErrorBoundary
      title="Connection Issue"
      icon="wifi"
      alertVariant="warning"
      retryLabel="Retry"
      retryVariant="warning"
      reloadLabel="Refresh"
      showDetails={false}
      onError={onError}
    >
      {children}
    </BaseErrorBoundary>
  );
}

export default AsyncErrorBoundary;
