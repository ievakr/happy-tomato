import React from 'react';
import BaseErrorBoundary from './BaseErrorBoundary';

/**
 * Error boundary for context-related errors.
 * Offers Restart and Reset App Data actions.
 */
function ContextErrorBoundary({ onError, children }) {
  return (
    <BaseErrorBoundary
      title="App Context Error"
      icon="storage"
      message={
        <>
          <p className="mb-2">There was an error with the application state. This might be due to:</p>
          <ul className="text-start mb-0">
            <li>Data synchronization issues</li>
            <li>Invalid data format</li>
            <li>Context provider errors</li>
          </ul>
        </>
      }
      showRetry={false}
      showReload={false}
      extraActions={[
        {
          label: 'Restart App',
          onClick: () => window.location.reload(),
          variant: 'danger',
          icon: 'refresh',
        },
        {
          label: 'Reset App Data',
          onClick: () => {
            localStorage.clear();
            window.location.reload();
          },
          variant: 'outline-secondary',
          icon: 'delete',
        },
      ]}
      onError={onError}
    >
      {children}
    </BaseErrorBoundary>
  );
}

export default ContextErrorBoundary;
