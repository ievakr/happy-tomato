# Error Boundaries and Error Handling

This document describes the comprehensive error boundary and error handling system implemented in the calendar application.

## Overview

The application implements a multi-layered error boundary system that provides graceful error handling at different levels:

1. **Global Error Boundary** - Catches all unhandled errors at the application level
2. **Context Error Boundary** - Handles context-related errors
3. **Async Error Boundary** - Specialized for async operations and network errors
4. **Component Error Boundaries** - Lightweight boundaries for individual components

## Error Boundary Components

### ErrorBoundary
Main error boundary component with comprehensive error handling.

```jsx
import { ErrorBoundary } from './components/common';

<ErrorBoundary
  title="Custom Error Title"
  message="Custom error message"
  showRetry={true}
  showReload={true}
  onError={(error, errorInfo) => console.log('Error occurred', error)}
>
  <YourComponent />
</ErrorBoundary>
```

**Props:**
- `title`: Custom error title
- `message`: Custom error message
- `showRetry`: Show retry button (default: true)
- `showReload`: Show reload button (default: true)
- `onError`: Callback function for error handling
- `fallback`: Custom fallback component function

### AsyncErrorBoundary
Specialized for handling async operations and network errors.

```jsx
import { AsyncErrorBoundary } from './components/common';

<AsyncErrorBoundary onError={handleAsyncError}>
  <ComponentWithAsyncOperations />
</AsyncErrorBoundary>
```

### ContextErrorBoundary
Handles errors related to React context.

```jsx
import { ContextErrorBoundary } from './components/common';

<ContextErrorBoundary onError={handleContextError}>
  <ContextWrapper>
    <App />
  </ContextWrapper>
</ContextErrorBoundary>
```

### ComponentErrorBoundary
Lightweight boundary for individual components.

```jsx
import { ComponentErrorBoundary } from './components/common';

<ComponentErrorBoundary
  componentName="MyComponent"
  onError={handleComponentError}
>
  <MyComponent />
</ComponentErrorBoundary>
```

## Error Logging System

### ErrorLogger
Centralized error logging with offline support and localStorage persistence.

```jsx
import errorLogger from './utils/errorLogger';

// Log an error
errorLogger.logError(
  error,
  errorInfo,
  'Context Name',
  { additionalData: 'value' }
);

// Get stored errors
const errors = errorLogger.getStoredErrors();

// Clear stored errors
errorLogger.clearStoredErrors();
```

### Global Error Handler
Catches uncaught errors and promise rejections.

```jsx
import globalErrorHandler from './utils/globalErrorHandler';

// Initialize (done automatically in index.js)
globalErrorHandler.init();

// Report error manually
globalErrorHandler.reportError(error, 'Context', { data: 'value' });
```

## React Hook for Error Handling

### useErrorHandler
Custom hook for manual error reporting and async operation wrapping.

```jsx
import { useErrorHandler } from './hooks';

function MyComponent() {
  const { reportError, wrapAsync, wrapEventHandler } = useErrorHandler();

  // Report error manually
  const handleError = (error) => {
    reportError(error, 'MyComponent Action', { userId: 123 });
  };

  // Wrap async function
  const fetchData = wrapAsync(async () => {
    const response = await fetch('/api/data');
    return response.json();
  }, 'Data Fetch');

  // Wrap event handler
  const handleClick = wrapEventHandler((event) => {
    // Event handler code
  }, 'Button Click');

  return (
    <button onClick={handleClick}>
      Click me
    </button>
  );
}
```

## Implementation in Components

### App Level
```jsx
// src/index.js
<ErrorBoundary title="Calendar App Error">
  <ContextErrorBoundary>
    <AsyncErrorBoundary>
      <ContextWrapper>
        <App />
      </ContextWrapper>
    </AsyncErrorBoundary>
  </ContextErrorBoundary>
</ErrorBoundary>
```

### Component Level
```jsx
// src/App.js
<ComponentErrorBoundary componentName="Header">
  <Header />
</ComponentErrorBoundary>
```

## Error Types and Handling

### Firebase Errors
- `permission-denied`: Authentication issues
- `unavailable`: Service temporarily unavailable
- `not-found`: Data not found
- `resource-exhausted`: Rate limiting

### Network Errors
- Connection timeout
- No internet connection
- Server unavailable

### React Errors
- Component rendering errors
- Hook errors
- Context errors

## Best Practices

### 1. Wrap Components Appropriately
```jsx
// Good: Wrap logical sections
<ComponentErrorBoundary componentName="UserProfile">
  <UserProfile />
</ComponentErrorBoundary>

// Bad: Wrap every single element
<ComponentErrorBoundary>
  <div>
    <ComponentErrorBoundary>
      <span>Text</span>
    </ComponentErrorBoundary>
  </div>
</ComponentErrorBoundary>
```

### 2. Provide Meaningful Error Messages
```jsx
<ErrorBoundary
  title="Profile Loading Error"
  message="Unable to load user profile. Please try again or contact support."
>
  <UserProfile />
</ErrorBoundary>
```

### 3. Use Async Error Handling
```jsx
// Good: Use the hook for async operations
const { wrapAsync } = useErrorHandler();

const saveData = wrapAsync(async (data) => {
  await api.save(data);
}, 'Save User Data');

// Bad: No error handling
const saveData = async (data) => {
  await api.save(data); // Unhandled errors
};
```

### 4. Log Errors with Context
```jsx
// Good: Provide context
errorLogger.logError(error, null, 'User Registration', {
  userId: user.id,
  step: 'email_verification',
  timestamp: Date.now()
});

// Bad: No context
errorLogger.logError(error);
```

## Error Monitoring

### Development
- All errors are logged to console
- Error details shown in development mode
- Stack traces available

### Production
- Errors stored in localStorage
- Queued for sending to error service when online
- User-friendly error messages shown

### Error Service Integration
Update `src/utils/errorLogger.js` to integrate with your error service:

```javascript
async sendToErrorService(errorLog) {
  await fetch('https://your-error-service.com/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(errorLog),
  });
}
```

### Sentry Integration
Sentry is supported out of the box.

- Frontend: set `REACT_APP_SENTRY_DSN` (and optionally `REACT_APP_VERSION`)
- Functions: set `sentry.dsn` via `firebase functions:config:set`

Example:
```
firebase functions:config:set sentry.dsn="https://examplePublicKey@o0.ingest.sentry.io/0"
```

## Testing Error Boundaries

### Manual Testing
```jsx
// Add a test component that throws errors
function ErrorTestComponent() {
  const [shouldThrow, setShouldThrow] = useState(false);
  
  if (shouldThrow) {
    throw new Error('Test error');
  }
  
  return (
    <button onClick={() => setShouldThrow(true)}>
      Test Error Boundary
    </button>
  );
}
```

### Automated Testing
```jsx
// Test error boundary behavior
test('error boundary catches errors', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };
  
  const { getByText } = render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );
  
  expect(getByText(/something went wrong/i)).toBeInTheDocument();
});
```

## Troubleshooting

### Common Issues

1. **Error boundaries not catching errors**
   - Check if error is thrown in event handler (not caught by error boundaries)
   - Verify error boundary is properly wrapped around component

2. **Async errors not handled**
   - Use AsyncErrorBoundary for components with async operations
   - Use useErrorHandler hook for manual async error handling

3. **Context errors**
   - Ensure ContextErrorBoundary wraps context providers
   - Check for null/undefined context values

### Debug Mode
Enable debug logging in development:

```javascript
// In development, log all errors to console
if (process.env.NODE_ENV === 'development') {
  window.addEventListener('error', (e) => {
    console.log('Global error:', e);
  });
}
```

This comprehensive error boundary system ensures that your calendar application gracefully handles errors at all levels, providing a better user experience and better debugging capabilities for developers. 