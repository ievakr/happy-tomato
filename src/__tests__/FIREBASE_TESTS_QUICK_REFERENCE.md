# Firebase Integration Tests - Quick Reference

## Quick Stats

- **Test File**: `src/__tests__/firebase.integration.test.js`
- **Tests**: 20/20 passing (100%)
- **Coverage**: All CRUD operations, error handling, retry logic, queue management

## Running Tests

```bash
# Run Firebase tests only
npm test -- firebase.integration.test --watchAll=false

# Run with verbose output
npm test -- firebase.integration.test --watchAll=false --verbose

# Run with coverage
npm test -- firebase.integration.test --coverage --watchAll=false
```

## Test Categories

| Category | Tests | Status |
|----------|-------|--------|
| Data Loading | 3 | ✅ 100% |
| Create Operations | 3 | ✅ 100% |
| Update Operations | 2 | ✅ 100% |
| Delete Operations | 3 | ✅ 100% |
| Error Handling | 3 | ✅ 100% |
| Queue Management | 2 | ✅ 100% |
| Retry Logic | 2 | ✅ 100% |
| Loading States | 2 | ✅ 100% |

## What's Tested

### ✅ CRUD Operations
- Fetching events from Firestore
- Adding new events
- Updating existing events
- Deleting events

### ✅ Error Handling
- Network errors
- Permission errors
- Service unavailable errors
- Non-existent document handling

### ✅ Retry Logic
- Automatic retry on failure
- Exponential backoff (1s, 2s)
- Maximum 3 attempts
- Proper error logging

### ✅ Concurrency
- Operation queuing
- Sequential processing
- No race conditions

### ✅ Loading States
- `isLoading` tracking
- `isInitialLoading` tracking
- `loadingOperation` type tracking

## Key Firebase Functions

```javascript
// Fetch all events
fetchEvents()

// Add new event
dispatchCallEvent({ type: 'push', payload: newEvent })

// Update event
dispatchCallEvent({ type: 'update', payload: updatedEvent })

// Delete event
dispatchCallEvent({ type: 'delete', payload: eventToDelete })
```

## Mock Setup Example

```javascript
// Mock successful add operation
addDoc.mockResolvedValueOnce({ 
  id: 'new-id', 
  path: 'events/new-id' 
});

// Mock error
const error = new Error('Network error');
addDoc.mockRejectedValue(error);

// Mock retry scenario
addDoc
  .mockRejectedValueOnce(new Error('Error'))
  .mockResolvedValueOnce({ id: 'new-id', path: 'events/new-id' });
```

## Test Pattern

```javascript
test('should do something', async () => {
  // 1. Setup mocks
  getDocs.mockResolvedValueOnce({ docs: [] });
  
  // 2. Render component
  render(<ContextWrapper><TestComponent /></ContextWrapper>);
  
  // 3. Wait for ready
  await waitFor(() => {
    expect(contextValue.isInitialLoading).toBe(false);
  });
  
  // 4. Perform action
  await act(async () => {
    await contextValue.dispatchCallEvent({ type: 'push', payload: data });
  });
  
  // 5. Verify result
  await waitFor(() => {
    expect(contextValue.savedEvents).toHaveLength(1);
  });
});
```

## Common Assertions

```javascript
// Verify Firebase function called
expect(addDoc).toHaveBeenCalledWith('events-collection', newEvent);

// Verify state updated
expect(contextValue.savedEvents).toHaveLength(1);

// Verify error logged
expect(errorLogger.logError).toHaveBeenCalled();

// Verify alert shown
expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('error'));
```

## Documentation

- **Full Guide**: `src/__tests__/README_FIREBASE_TESTS.md`
- **Summary**: `FIREBASE_INTEGRATION_TESTS_SUMMARY.md`
- **Quick Reference**: This file

## Troubleshooting

### Test Timeout
- Increase timeout in `waitFor()`: `{ timeout: 10000 }`
- Ensure mocks are properly configured
- Check that async operations are awaited

### Mock Not Working
- Clear mocks between tests: `jest.clearAllMocks()`
- Verify mock function names match imports
- Check mock return values are correct

### Unexpected Failures
- Review console logs for operation details
- Verify test isolation (no shared state)
- Check for race conditions in async code

## Related Files

- `src/context/ContextWrapper.js` - Firebase operations implementation
- `src/firebase.js` - Firebase configuration
- `src/utils/errorLogger.js` - Error logging utility

## Quick Commands

```bash
# Just run the tests
npm test -- firebase.integration.test --watchAll=false

# Show test names only
npm test -- firebase.integration.test --watchAll=false 2>&1 | grep "✓"

# Count passing tests
npm test -- firebase.integration.test --watchAll=false 2>&1 | grep "Tests:" 

# Check for failures
npm test -- firebase.integration.test --watchAll=false 2>&1 | grep "✕"
```

## Test Output

```
PASS src/__tests__/firebase.integration.test.js
  Firebase Integration Tests
    Initial Data Loading (fetchEvents)
      ✓ should successfully fetch events from Firestore on mount
      ✓ should handle empty events collection
      ✓ should handle fetch errors gracefully with retry
    Create Event (push operation)
      ✓ should successfully add a new event to Firestore
      ✓ should retry failed add operations
      ✓ should handle add operation errors after all retries
    Update Event (update operation)
      ✓ should successfully update an existing event in Firestore
      ✓ should handle update operation errors with retry
    Delete Event (delete operation)
      ✓ should successfully delete an existing event from Firestore
      ✓ should handle deleting non-existent document gracefully
      ✓ should handle delete operation errors with retry
    Error Handling
      ✓ should handle Firebase permission-denied errors
      ✓ should handle Firebase unavailable errors
      ✓ should handle network errors
    Operation Queue Management
      ✓ should queue operations when one is in progress
      ✓ should process queued operations in order
    Retry Logic with Exponential Backoff
      ✓ should use exponential backoff for retries
      ✓ should fail after maximum retries
    Loading States
      ✓ should set loading states during operations
      ✓ should set correct loading operation type

Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
```

## Success Criteria

✅ All 20 tests passing  
✅ No linter errors  
✅ Complete CRUD coverage  
✅ Error handling verified  
✅ Retry logic confirmed  
✅ Queue management tested  
✅ Documentation complete  

## Status: COMPLETE ✅

All Firebase integration tests are passing and fully documented.

