# Recurring Actions System

This document describes the new recurring actions feature that automatically creates TO DO events based on action intervals.

## Overview

The system allows users to:
1. **Create Action Events**: When you add an action like "Fertilized", the system automatically creates recurring TO DO events
2. **Auto-generate TO DOs**: Based on dosage patterns (e.g., "Use every 7 days"), the system creates future TO DO events
3. **Complete TO DOs**: Users can mark TO DO events as completed, which converts them into completed action events

## How It Works

### 1. Action Creation with Auto-TO DO Generation

When you create an action event:
- The system checks the `PLANT_ACTIONS` constants for dosage information
- If the action has a recurring pattern (e.g., "Use every 7 days"), it automatically generates TO DO events
- TO DOs are created for up to 6 months in the future (configurable)

**Example:**
- Action: "Fertilized" with dosage "Use every 7 days"
- Result: Creates TO DO events every 7 days for 6 months

### 2. TO DO Event Management

**TO DO Events have special properties:**
- `isRecurringTodo: true` - Identifies them as auto-generated TO DOs
- `originalActionId` - Links back to the original action
- `recurringInterval` - The interval (e.g., 7 days)
- `completed: false` - Tracks completion status

### 3. TO DO Completion

When a user completes a TO DO:
- A new "completed action" event is created
- The original TO DO event is removed from the calendar
- The completed action shows with green styling and a check mark

## Visual Indicators

### Calendar Day View
- **TO DO Events**: Orange/amber styling with unchecked circle icon
- **Completed Actions**: Green styling with checked circle icon  
- **Regular Events**: Blue styling with standard event icon

### Mobile Event Count
- **Orange dot**: When day has pending TO DOs
- **Green dot**: When day has completed actions
- **Blue dot**: Regular events only

### Event Modal
- **TO DO Events**: Show a green "Complete" button instead of delete
- **Regular Events**: Show red delete button as usual

## Implementation Files

### Core Logic
- `src/utils/recurringActions.js` - Utility functions for parsing intervals and generating TO DOs
- `src/hooks/useRecurringActions.js` - React hook for managing recurring actions

### UI Components
- `src/components/forms/EventModal.js` - Updated to handle TO DO completion
- `src/components/calendar/CalendarDay.js` - Visual styling for different event types

### Constants
- `src/constants/index.js` - Added TO DO statuses and event types

## Supported Patterns

The system recognizes these dosage patterns:

- `"Use every X days"` - Creates recurring TO DOs every X days
- `"Use every X days, Y times max"` - Limits to Y occurrences
- `"Use once"` - No recurring TO DOs generated

## Example Workflow

1. **Create Action**: User creates "Fertilized" action for tomatoes on March 1st
2. **Auto-generate**: System creates TO DO events for March 8th, 15th, 22nd, etc.
3. **User sees TO DOs**: Orange TO DO events appear in calendar
4. **Complete TO DO**: User clicks TO DO on March 8th and marks it complete
5. **Result**: March 8th now shows a green "Fertilized" completed action

## Configuration

### Customizing Intervals
Edit `src/constants/index.js` `PLANT_ACTIONS` to modify or add new recurring patterns:

```javascript
export const PLANT_ACTIONS = {
  "Fertilized": "Use every 7 days",
  "Watered": "Use every 2 days",
  "MyNewAction": "Use every 14 days"
};
```

### Customizing Generation Period
In `src/utils/recurringActions.js`, modify the `generateRecurringToDos` function:

```javascript
// Change from 6 months to 3 months
export const generateRecurringToDos = (actionEvent, dosageText, futureMonths = 3) => {
  // ...
}
```

## Testing

A demo component is included at `src/components/demo/RecurringActionsDemo.js` that provides:
- Test action creation button
- Test TO DO completion button  
- Event analysis to see breakdown of event types

## Future Enhancements

Potential improvements:
- **Snooze TO DOs**: Allow postponing a TO DO to a later date
- **Batch operations**: Complete multiple TO DOs at once
- **Smart notifications**: Remind users of overdue TO DOs
- **Custom intervals**: Allow users to set custom recurring patterns
- **TO DO templates**: Pre-defined TO DO sequences for common gardening tasks

## Cleanup

The demo component in `src/components/demo/RecurringActionsDemo.js` and its import in `src/App.js` can be removed once testing is complete.
