# Fix: Email Date Mismatch in Advance Reminders

## Problem
When receiving a 1-day advance email notification, the email was talking about "today's tasks" instead of "tomorrow's tasks". This created confusion about which day's tasks were being referenced.

## Root Cause
The SendGrid email function in Cloud Functions was always showing a generic message about "tasks that need your attention" without specifying whether they were due today or in the future. For advance reminders, this made it seem like the tasks were due today, when they were actually due tomorrow (or X days in the future).

## Solution
Updated `/functions/index.js` (the SendGrid email function) to:

1. **Calculate context date**: For advance reminders, calculate the actual date the tasks are due (e.g., tomorrow for 1-day advance, 3 days from now for 3-day advance)

2. **Smart message generation in both HTML and plain text**:
   - For advance reminders: "You have X tasks coming up in Y days (date)"
   - For daily reminders: "You have X tasks for today (date)"

3. **Updated email content**: Both HTML and plain text versions now clearly state when tasks are due

## Changes Made

### HTML Email Content:
```javascript
if (reminderType.includes("Advance")) {
  // Extract days from reminder type
  const daysAhead = parseInt(match[1], 10);
  contextDate.setDate(contextDate.getDate() + daysAhead);
  reminderMessage = `You have ${todos.length} garden tasks coming up in ${daysAhead} days (${contextDate.toLocaleDateString()})`;
} else {
  reminderMessage = `You have ${todos.length} garden tasks for today (${new Date().toLocaleDateString()})`;
}
```

### Plain Text Email:
Updated to match the HTML version with the same clear messaging about when tasks are due.

## Deployment

To deploy this fix to your Firebase Cloud Functions:

```bash
cd /Users/ievak/happy-tomato
firebase deploy --only functions
```

## Testing

1. After deploying, set up a 1-day advance reminder in your app settings
2. Create a task for tomorrow
3. Wait for the reminder at your configured time (or check Firebase logs)
4. Verify the email clearly states: "You have X tasks coming up in 1 day (tomorrow's date)"

## Example Email Messages

### Before Fix:
❌ "You have 2 garden tasks that need your attention:"
- Unclear if tasks are today or tomorrow

### After Fix:
✅ **For 1-day advance**: "You have 2 garden tasks coming up in 1 day (10/24/2025):"
✅ **For daily reminder**: "You have 2 garden tasks for today (10/23/2025):"

## Files Modified
- `/functions/index.js` - Updated `sendEmail()` function with context date calculation and clear messaging for both HTML and plain text emails
- `/src/services/emailService.js` - Also updated (though this is for EmailJS which you're not using)
