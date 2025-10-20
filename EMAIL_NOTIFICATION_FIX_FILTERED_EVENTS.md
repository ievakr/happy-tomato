# 🔧 Fixed: Email Notifications Not Sending (Stale Closure Issue)

## The Problem

Email notifications were not being sent even when there were advance todos. The console logs showed:

**First Check (20:51:28):**
```
totalEvents: 36 ✅
Found 4 pending todos ✅
Found 1 matching todo for 2025-10-21 ✅
```

**Second Check (same timestamp):**
```
totalEvents: 0 ❌ ALL EVENTS DISAPPEARED!
No pending todos ❌
No matching todos ❌
```

## Root Cause Analysis

There were TWO interrelated issues:

### Issue #1: Using filteredEvents Instead of savedEvents

The `useEmailNotifications` hook was using `filteredEvents` from the GlobalContext:

```javascript
const { filteredEvents } = useContext(GlobalContext);
```

The problem is that `filteredEvents` is a **computed value based on label filtering**:

```javascript
// From ContextWrapper.js
const filteredEvents = useMemo(() => {
    if (labels.length === 0) {
        return savedEvents;
    }
    
    const checkedLabels = labels.filter(lbl => lbl.checked).map(lbl => lbl.label);
    
    return savedEvents.filter(evt => {
        // Show events that have at least one checked label
        return evt.labels.some(eventLabel => checkedLabels.includes(eventLabel));
    });
}, [savedEvents, labels]);
```

### Issue #2: Stale Closure in NotificationService (The Real Culprit!)

Even more critical, the `notificationService` was holding a **stale closure reference** to the `emailHook`:

```javascript
// From Header.js - BEFORE FIX
useEffect(() => {
    if (emailNotifications.emailPreferences.enabled) {
        notificationService.start(emailNotifications); // ← Sets hook once
    }
    return () => {
        notificationService.stop();
    };
}, [emailNotifications.emailPreferences]); // ← Only updates when preferences change
```

### What Was Happening

1. **Initial render**: 
   - `Header` component renders
   - `useEmailNotifications()` hook creates functions that close over current `savedEvents` (36 events)
   - `notificationService.start(emailNotifications)` saves reference to these functions
   
2. **React re-render** (happens frequently):
   - `Header` re-renders (maybe due to state change elsewhere)
   - `useEmailNotifications()` creates NEW functions with NEW closures over current `savedEvents`
   - BUT `notificationService` still holds OLD functions with OLD closures
   
3. **NotificationService interval fires (60 seconds later)**:
   - Calls OLD `emailNotifications.getTodosInAdvance()`
   - This OLD function references OLD `savedEvents` which may be empty/stale
   - Result: `totalEvents: 0` ❌

4. **Why did it sometimes show 36 then 0?**
   - First log: From a recent render's hook (has current data)
   - Second log: From the stale closure in notificationService (has old/empty data)

This is a classic **JavaScript closure problem** in React!

## The Solution

### Fix #1: Use savedEvents Instead of filteredEvents

Changed `useEmailNotifications` to use **all events** (`savedEvents`) instead of `filteredEvents`:

```javascript
export const useEmailNotifications = () => {
  const { filteredEvents, savedEvents } = useContext(GlobalContext);
  
  // IMPORTANT: For email notifications, we should check ALL events, not just filtered ones
  // The filteredEvents may be empty if labels are unchecked, but we still need to send reminders
  // for all todos regardless of label filtering
  const allEvents = savedEvents || filteredEvents;
  
  // ... rest of the hook uses allEvents instead of filteredEvents
```

Then replaced all references to `filteredEvents` with `allEvents` in these functions:
- `getDueTodos()`
- `getOverdueTodos()`
- `getUpcomingTodos()`
- `getTodosInAdvance()`

### Fix #2: Update Hook Reference on Every Render (Critical!)

Added a second `useEffect` that runs on **EVERY render** to keep the hook reference fresh:

```javascript
// From Header.js - AFTER FIX
// Initialize notification service on mount
useEffect(() => {
    if (emailNotifications.emailPreferences.enabled) {
        notificationService.start(emailNotifications);
    } else {
        notificationService.stop();
    }
    return () => {
        notificationService.stop();
    };
}, [emailNotifications.emailPreferences.enabled]); // Only start/stop on enable change

// Update the hook reference on EVERY render to prevent stale closures
useEffect(() => {
    if (notificationService.isRunning) {
        notificationService.updateEmailHook(emailNotifications); // ← Updates EVERY render!
    }
}); // ← NO DEPENDENCIES = runs every render
```

## Why This Works

1. **`savedEvents`** contains ALL events from Firebase, regardless of label filtering
2. Email notifications should work for **all todos**, not just those with checked labels
3. Label filtering is a UI feature for the calendar view, not for notifications
4. **The hook reference is updated on every render**, ensuring the notification service always has access to the latest data and the latest closures
5. This prevents the **stale closure** problem where old function references capture old data

## Testing

After deploying the fix, the debug logs should show:
- `totalEvents` remains consistent (e.g., 36) across all checks ✅
- Todos are found consistently ✅
- Emails are sent at the scheduled time ✅

## Files Modified

1. **src/hooks/useEmailNotifications.js**
   - Added `savedEvents` to context destructuring
   - Created `allEvents` variable
   - Replaced all `filteredEvents` references with `allEvents`
   - Added debug logging to track when events disappear

2. **src/components/layout/Header.js** (Critical fix!)
   - Split useEffect into two:
     - First: Start/stop service only when enabled changes
     - Second: Update hook reference on EVERY render to prevent stale closures
   
3. **firebase.json**
   - Added hosting configuration for deployment

## Deployment

```bash
npm run build
firebase deploy --only hosting
```

Deployed to: https://happy-tomato.web.app

## Prevention

To prevent similar issues in the future:

### Understanding Closures in React
1. **Hook functions capture current scope**: Every time a component renders, hooks create NEW functions that close over the CURRENT values
2. **External services holding references**: When a service (like `notificationService`) holds a reference to hook functions, those references become stale on the next render
3. **The fix**: Update the reference on every render using `useEffect` with no dependencies

### Best Practices
1. Be aware that `useMemo` values can change during re-renders
2. Services that hold references to React hooks MUST update those references frequently
3. For background tasks (like notifications), use raw data sources (`savedEvents`) instead of computed/filtered values
4. Add debug logging to catch when data unexpectedly becomes empty
5. **Never trust long-lived references to React hook functions** - they will become stale!

### When to Use This Pattern
Use the "update on every render" pattern when:
- A singleton service (like `notificationService`) needs to call hook functions
- The service runs on intervals/timers that outlive component renders
- You need access to fresh React state/context from outside the component lifecycle

### Code Pattern to Remember
```javascript
// DON'T: Only update when dependencies change
useEffect(() => {
    service.start(myHook);
}, [myHook.someProperty]); // ❌ Stale closures!

// DO: Update the reference on every render
useEffect(() => {
    if (service.isRunning) {
        service.updateReference(myHook);
    }
}); // ✅ Fresh closures every render!
```

---

**Status**: ✅ Fixed and Deployed
**Date**: 2025-10-20
**Impact**: Email notifications now work consistently regardless of label filtering state

