import React from 'react';
import BaseErrorBoundary from './BaseErrorBoundary';

/**
 * Lightweight error boundary for individual components.
 * Uses compact layout with component name.
 */
function ComponentErrorBoundary({
  componentName = 'Component',
  fallback,
  onError,
  children,
}) {
  return (
    <BaseErrorBoundary
      componentName={componentName}
      compact
      showReload={false}
      fallback={fallback}
      onError={onError}
    >
      {children}
    </BaseErrorBoundary>
  );
}

export default ComponentErrorBoundary;
