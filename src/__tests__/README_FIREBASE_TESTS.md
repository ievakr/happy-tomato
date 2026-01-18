# Firebase Integration Tests

This directory contains comprehensive integration tests for Firebase Firestore operations used in the Happy Tomato application.

## Test File

- `firebase.integration.test.js` - **20/20 tests passing (100%)** - Integration tests for all Firebase CRUD operations

## Overview

The Firebase integration tests verify that the application correctly interacts with Firebase Firestore for:
- Data persistence (events storage)
- CRUD operations (Create, Read, Update, Delete)
- Error handling and retry logic
- Operation queuing and concurrency management
- Loading states during async operations

## Test Structure

### 1. Initial Data Loading (`fetchEvents`)

Tests the loading of events from Firestore when the application starts:

- ✅ Successfully fetches events from Firestore on mount
- ✅ Handles empty events collection
- ✅ Handles fetch errors gracefully with retry logic

### 2. Create Event (`push` operation)

Tests adding new events to Firestore:

- ✅ Successfully adds a new event to Firestore
- ✅ Retries failed add operations with exponential backoff
- ✅ Handles add operation errors after all retries

### 3. Update Event (`update` operation)

Tests updating existing events in Firestore:

- ✅ Successfully updates an existing event in Firestore
- ✅ Handles update operation errors with retry logic

### 4. Delete Event (`delete` operation)

Tests deleting events from Firestore:

- ✅ Successfully deletes an existing event from Firestore
- ✅ Handles deleting non-existent documents gracefully
- ✅ Handles delete operation errors with retry logic

### 5. Error Handling

Tests various Firebase error scenarios:

- ✅ Handles Firebase `permission-denied` errors
- ✅ Handles Firebase `unavailable` errors (service temporarily unavailable)
- ✅ Handles network errors (connection issues)

### 6. Operation Queue Management

Tests concurrent operation handling:

- ✅ Queues operations when one is in progress
- ✅ Processes queued operations in order

### 7. Retry Logic with Exponential Backoff

Tests the retry mechanism:

- ✅ Uses exponential backoff for retries (1s, 2s delays)
- ✅ Fails after maximum retries (3 attempts total)

### 8. Loading States

Tests UI loading state management:

- ✅ Sets loading states during operations
- ✅ Sets correct loading operation type

## Testing Approach

### Mocking Strategy

The tests use Jest mocks for Firebase modules to avoid actual database connections:

```javascript
jest.mock('../firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn()
}));
```

### Test Pattern

Each test follows this general pattern:

1. **Setup** - Mock Firebase functions with desired behavior
2. **Render** - Render the `ContextWrapper` component
3. **Wait** - Wait for initial loading to complete
4. **Act** - Perform the operation being tested
5. **Assert** - Verify expected outcomes

Example:

```javascript
test('should successfully add a new event to Firestore', async () => {
  // Setup
  getDocs.mockResolvedValueOnce({ docs: [] });
  const mockDocRef = { id: 'generated-id-123', path: 'events/generated-id-123' };
  addDoc.mockResolvedValueOnce(mockDocRef);

  // Render
  render(
    <ContextWrapper>
      <TestComponent />
    </ContextWrapper>
  );

  // Wait
  await waitFor(() => {
    expect(contextValue.isInitialLoading).toBe(false);
  });

  // Act
  await act(async () => {
    await contextValue.dispatchCallEvent({ type: 'push', payload: newEvent });
  });

  // Assert
  await waitFor(() => {
    expect(addDoc).toHaveBeenCalledWith('events-collection', newEvent);
    expect(contextValue.savedEvents).toHaveLength(1);
  });
});
```

## Running the Tests

```bash
# Run only Firebase integration tests
npm test -- firebase.integration.test --watchAll=false

# Run with coverage
npm test -- firebase.integration.test --coverage --watchAll=false

# Run in watch mode
npm test -- firebase.integration.test
```

## Key Firebase Operations Tested

### 1. `fetchEvents()`

Located in `ContextWrapper.js`, this function loads all events from Firestore:

```javascript
const snapshot = await getDocs(collection(db, "events"));
const events = snapshot.docs.map(doc => {
  return { id: doc.id, ...doc.data() };
});
```

### 2. `handleEventDispatch()` - Push

Adds a new event to Firestore:

```javascript
const addDocRef = await addDoc(collection(db, "events"), payload);
payload.id = addDocRef.id; // Update with Firebase-generated ID
```

### 3. `handleEventDispatch()` - Update

Updates an existing event in Firestore:

```javascript
await updateDoc(doc(db, "events", payload.id), payload);
```

### 4. `handleEventDispatch()` - Delete

Deletes an event from Firestore with existence check:

```javascript
const docRef = doc(db, "events", payload.id);
const docSnap = await getDoc(docRef);
if (docSnap.exists()) {
  await deleteDoc(docRef);
}
```

## Error Handling

The tests verify proper error handling for:

1. **Firebase Error Codes**:
   - `permission-denied` - Authentication/permission issues
   - `unavailable` - Service temporarily down
   - `not-found` - Document doesn't exist
   - And more...

2. **Network Errors**:
   - Connection failures
   - Timeout errors
   - Fetch failures

3. **Retry Logic**:
   - Automatic retry with exponential backoff (1s, 2s)
   - Maximum 3 attempts (initial + 2 retries)
   - Proper error logging after all retries fail

## Concurrency and Queue Management

The application prevents race conditions by:

1. **Queuing operations** - If an operation is in progress, new operations are queued
2. **Sequential processing** - Operations are processed one at a time
3. **Automatic queue processing** - After each operation completes, the next queued operation starts

This is verified by tests that dispatch multiple operations rapidly and verify they're all processed correctly.

## Loading State Management

The tests verify that the application properly tracks loading states:

- `isLoading` - Boolean indicating if any operation is in progress
- `isInitialLoading` - Boolean indicating if initial data load is in progress
- `loadingOperation` - String indicating the type of operation ('load', 'push', 'update', 'delete')

## Integration with EventContext

All Firebase operations are integrated into the EventContext, making them available throughout the application:

```javascript
const {
  savedEvents,          // Array of all events
  dispatchCallEvent,    // Function to perform CRUD operations
  isLoading,            // Loading state
  isInitialLoading,     // Initial load state
  loadingOperation      // Current operation type
} = useContext(EventContext);
```

## Coverage

The Firebase integration tests provide comprehensive coverage of:

- ✅ All CRUD operations (Create, Read, Update, Delete)
- ✅ Success scenarios
- ✅ Error scenarios
- ✅ Retry logic
- ✅ Network failures
- ✅ Firebase-specific errors
- ✅ Concurrent operation handling
- ✅ Loading state management

## Test Maintenance

### Adding New Tests

When adding new Firebase-related features:

1. Add a new test to the appropriate describe block
2. Follow the existing test pattern
3. Mock Firebase functions appropriately
4. Use `waitFor` for async operations
5. Verify both success and error cases

### Updating Existing Tests

When modifying Firebase operations:

1. Update relevant tests to match new behavior
2. Ensure all tests still pass
3. Add new tests for any new error cases
4. Update this documentation

## Common Testing Patterns

### Mocking Successful Operations

```javascript
getDocs.mockResolvedValueOnce({ docs: [] });
addDoc.mockResolvedValueOnce({ id: 'new-id', path: 'events/new-id' });
```

### Mocking Errors

```javascript
const error = new Error('Operation failed');
error.code = 'permission-denied';
addDoc.mockRejectedValue(error);
```

### Mocking Retry Scenarios

```javascript
// Fail first attempt, succeed on second
addDoc
  .mockRejectedValueOnce(new Error('Network error'))
  .mockResolvedValueOnce(mockDocRef);
```

### Waiting for Async Operations

```javascript
await waitFor(() => {
  expect(contextValue.savedEvents).toHaveLength(1);
}, { timeout: 10000 });
```

## Dependencies

These tests require:

- `@testing-library/react` - For rendering React components
- `@testing-library/jest-dom` - For DOM matchers
- `dayjs` - For date manipulation
- Firebase mocks (defined in the test file)

No additional packages are required beyond the standard test setup.

## Troubleshooting

### Tests Timing Out

If tests are timing out, check:

1. Mock functions are properly configured
2. `waitFor` timeout is sufficient (default is 1000ms, tests use 10000ms)
3. Async operations are properly awaited

### Unexpected Test Failures

If tests fail unexpectedly:

1. Check that mocks are cleared between tests (`jest.clearAllMocks()`)
2. Verify Firebase mock implementations are correct
3. Ensure `act()` wraps all state updates
4. Check for race conditions in async operations

### Adding New Firebase Operations

When adding new Firebase operations:

1. Add corresponding mocks in the test file
2. Create new test cases
3. Follow existing patterns for async/await handling
4. Test both success and error scenarios

## Future Enhancements

Potential improvements to the test suite:

- [ ] Add tests for batch operations (if implemented)
- [ ] Add tests for real-time listeners (if implemented)
- [ ] Add tests for offline persistence (if implemented)
- [ ] Add performance benchmarks for operations
- [ ] Add tests for Firebase authentication (if implemented)

## Related Documentation

- `src/hooks/TESTING_README.md` - General testing documentation for hooks
- `src/docs/ERROR_BOUNDARIES.md` - Error handling patterns
- `COMPLETE_REMAINING_TESTS.md` - Guide for completing other tests

## Contributing

When contributing to Firebase integration tests:

1. Maintain 100% test coverage for Firebase operations
2. Follow the existing test patterns and structure
3. Add tests for both success and error scenarios
4. Update this documentation with any changes
5. Ensure all tests pass before submitting

## Summary

The Firebase integration tests provide comprehensive coverage of all database operations in the Happy Tomato application. With 20 passing tests covering CRUD operations, error handling, retry logic, and concurrency management, these tests ensure that the application reliably interacts with Firebase Firestore in all scenarios.

**Test Status**: ✅ **20/20 tests passing (100%)**

