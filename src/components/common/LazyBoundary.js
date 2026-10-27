import React, { Suspense } from 'react';
import ComponentErrorBoundary from './ComponentErrorBoundary';

/**
 * Lazy view plus a component-level error boundary.
 * Suspense wraps the boundary so a chunk load and a render error
 * each get their own fallback.
 */
function LazyBoundary({ name, fallback, onError, children }) {
  return (
    <Suspense fallback={fallback}>
      <ComponentErrorBoundary componentName={name} onError={onError}>
        {children}
      </ComponentErrorBoundary>
    </Suspense>
  );
}

export default LazyBoundary;
