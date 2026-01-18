# Hook Unit Tests

This directory contains comprehensive unit tests for all custom React hooks used in the Happy Tomato application.

## Test Files

- ✅ `useErrorHandler.test.js` - **14/14 tests passing** - Tests for error handling utilities
- ⚠️ `useResponsive.test.js` - **25/31 tests passing** - Tests for responsive design utilities
- ⚠️ `useSwipeGestures.test.js` - **16/17 tests passing** - Tests for touch gesture handling
- ⚠️ `useEmailNotifications.test.js` - **16/29 tests passing** - Tests for email notification functionality
- ⚠️ `useRecurringActions.test.js` - **0/24 tests** - Tests for recurring action management
- ⚠️ `useCalendar.test.js` - **0/4 tests** - Tests for calendar state management
- ⚠️ `useEvents.test.js` - **0/10 tests** - Tests for event CRUD operations

## Test Infrastructure

### Test Wrapper

A custom test wrapper is provided in `src/test-utils/test-wrapper.js` to wrap hooks that depend on the app contexts:

```javascript
import { createWrapper } from '../test-utils/test-wrapper';

// Basic usage
const { result } = renderHook(() => useMyHook(), {
  wrapper: createWrapper()
});

// With custom context values
const { result } = renderHook(() => useMyHook(), {
  wrapper: createWrapper({
    filteredEvents: mockEvents,
    dispatchCallEvent: mockDispatch
  })
});
```

### Setup

Tests use the following packages:
- `@testing-library/react` - For rendering hooks and components
- `@testing-library/jest-dom` - For DOM matchers
- `jest` - Test runner (built into react-scripts)

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- useEmailNotifications.test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage --watchAll=false
```

## Test Patterns

### Testing Hooks with Context

Hooks that use the shared contexts require the wrapper:

```javascript
describe('useEmailNotifications', () => {
  test('should get due todos', () => {
    const mockEvents = [
      { id: '1', title: 'TO DO: Task', day: dayjs().toISOString(), completed: false }
    ];
    
    const { result } = renderHook(() => useEmailNotifications(), {
      wrapper: createWrapper({ filteredEvents: mockEvents })
    });
    
    const dueTodos = result.current.getDueTodos();
    expect(dueTodos).toHaveLength(1);
  });
});
```

### Testing Hooks without Context

Hooks that don't use context can be tested directly:

```javascript
describe('useErrorHandler', () => {
  test('should report errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      result.current.reportError(new Error('test'));
    });
    
    expect(errorLogger.logError).toHaveBeenCalled();
  });
});
```

### Testing Async Operations

Use `act` and `async/await` for async operations:

```javascript
test('should send email', async () => {
  const { result } = renderHook(() => useEmailNotifications(), {
    wrapper: createWrapper()
  });
  
  let success;
  await act(async () => {
    success = await result.current.sendDailyReminder();
  });
  
  expect(success).toBe(true);
});
```

### Mocking Dependencies

Mock external dependencies at the top of test files:

```javascript
jest.mock('../services/emailService');
jest.mock('../utils/errorLogger');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
```

## Fixing Remaining Tests

### Common Issues

1. **React.useContext.mockReturnValue is not a function**
   - Solution: Use `createWrapper` with custom context values instead of mocking React
   
   ```javascript
   // ❌ Don't do this
   React.useContext.mockReturnValue({ filteredEvents: [] });
   
   // ✅ Do this
   const { result } = renderHook(() => useMyHook(), {
     wrapper: createWrapper({ filteredEvents: [] })
   });
   ```

2. **localStorage not persisting**
   - The mock localStorage saves to a temporary store
   - Call `localStorage.clear()` in `beforeEach` to reset between tests

3. **Time-based tests**
   - Mock `Date.now()` and `dayjs()` for consistent results
   - Use `jest.spyOn(Date, 'now').mockReturnValue(timestamp)`

### Steps to Complete Tests

For each failing test:

1. Check if the hook uses one of the shared contexts
2. If yes, ensure the test uses `createWrapper()` with appropriate context values
3. If the test needs specific `filteredEvents`, pass them to `createWrapper()`
4. Remove any `React.useContext.mockReturnValue()` calls
5. Ensure all mocked dependencies are properly cleared in `beforeEach`

Example fix:

```javascript
// Before
test('should get todos', () => {
  const React = require('react');
  React.useContext.mockReturnValue({
    filteredEvents: [...]
  });
  const { result } = renderHook(() => useMyHook());
  // assertions
});

// After
test('should get todos', () => {
  const mockEvents = [...];
  const { result } = renderHook(() => useMyHook(), {
    wrapper: createWrapper({ filteredEvents: mockEvents })
  });
  // assertions
});
```

## Test Coverage Goals

Target coverage for each hook:
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Key Test Scenarios

### useEmailNotifications
- ✅ Preference management (load, save, update, reset)
- ⚠️ TODO filtering (due today, overdue, upcoming, advance)
- ⚠️ Email sending (daily reminders, advance reminders)
- ✅ Email service integration
- ⚠️ Reminder scheduling logic

### useRecurringActions
- ⚠️ Creating actions with recurring TODOs
- ⚠️ Completing TODOs and converting to actions
- ⚠️ TODO queries (pending, completed, upcoming)
- ⚠️ Bulk deletion of recurring TODOs
- ⚠️ Event updates with recalculation

### useCalendar
- ⚠️ Month initialization
- ⚠️ Month navigation
- ⚠️ Integration with shared contexts

### useEvents
- ⚠️ CRUD operations (create, read, update, delete)
- ⚠️ Event filtering by day
- ⚠️ Modal management

### useErrorHandler
- ✅ Manual error reporting
- ✅ Async error handling
- ✅ Event handler wrapping
- ✅ Function stability

### useResponsive
- ✅ Window size tracking
- ✅ Breakpoint detection (mobile, tablet, desktop)
- ⚠️ Resize handling
- ✅ Edge cases (very small/large sizes)

### useSwipeGestures
- ✅ Touch gesture detection (left/right swipes)
- ✅ Threshold configuration
- ✅ Multi-touch handling
- ⚠️ Event listener cleanup

## Contributing

When adding new hooks:
1. Create a corresponding test file
2. Follow the existing test patterns
3. Aim for high coverage (>80%)
4. Test both success and error paths
5. Test edge cases and boundary conditions

## Notes

- Tests use `jest.fn()` for mocking
- Async tests should use `act()` from `@testing-library/react`
- Context-dependent hooks need the `createWrapper` helper
- LocalStorage operations are mocked for isolation
- Time-dependent tests may need Date/dayjs mocking for consistency


