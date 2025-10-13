# ✅ Testing the Settings Fix

## Quick Test (5 minutes)

### 1. Restart the App
```bash
cd /Users/ievak/happy-tomato
npm start
```

Wait for the app to fully load.

### 2. Open Browser Console
Press **F12** (or right-click → Inspect) and go to **Console** tab.
Keep it open so you can see the logs.

### 3. Configure Settings

Click the **📧 Email** button in the header.

**Set these values:**
- ✅ Enable email notifications: **ON**
- ✅ Daily reminder email: **ON**
- ✅ Reminder time: **Set to current time** (look at your clock!)
- ✅ Advance reminder emails: **ON** (if not already)
- ✅ How many days in advance: **1**

**Example:** If it's 12:35 right now, set reminder time to **12:35**

Click **"Save Settings"** (this just closes the modal - everything auto-saves!)

### 4. Watch the Console

Within **60 seconds**, you should see these logs appear:

```javascript
Notification service already running, updating email hook reference...

🔍 Reminder check at 12:35:xx:
{
  shouldSendDaily: false,  // (false because no TODOs)
  shouldSendAdvance: false, // (false because no TODOs)
  preferences: {
    enabled: true,
    dailyReminder: true,
    reminderTime: '12:35',  // ✅ Should match what you set!
    userEmail: true
  }
}

🔍 Daily reminder check details:
{
  currentTime: '12:35:xx',
  reminderTime: '12:35',     // ✅ NEW VALUE!
  isTimeToSend: true,         // ✅ Should be true!
  haventSentAutoToday: true,
  hasTodosToRemind: false,    // No TODOs created yet
  dueTodosCount: 0,
  overdueTodosCount: 0,
  shouldSend: false           // False because no TODOs (that's ok!)
}

🔍 Advance reminder check details:
{
  currentTime: '12:35:xx',
  reminderTime: '12:35',     // ✅ NEW VALUE!
  isTimeToSend: true,
  haventSentAutoToday: true,
  hasTodosToRemind: false,
  advanceDays: 1,             // ✅ NEW VALUE!
  advanceTodosCount: 0,
  shouldSend: false           // False because no TODOs
}

✅ Advance reminder check: 
{
  enabled: true,
  advanceReminders: true      // ✅ NOW IT'S TRUE!
}
```

### 5. Key Things to Verify

✅ **reminderTime** should show your current time, not the old time!
✅ **advanceReminders** should be `true`, not `false`!
✅ **advanceDays** should be `1`, not `3`!
✅ **isTimeToSend** should be `true` since current time >= reminder time

## What If It Still Shows Old Values?

If you still see old values like `reminderTime: '15:50'`:

1. **Hard refresh the page:** Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. **Clear React cache:**
   ```bash
   # Stop the app (Ctrl+C)
   rm -rf node_modules/.cache
   npm start
   ```
3. **Check for multiple tabs:** Close any other tabs with the app open

## Success Indicators

### ✅ It's Working If:
- Console shows `updating email hook reference...`
- Reminder time matches what you set
- Advance reminders shows as `true`
- `isTimeToSend` is `true`

### ❌ Still Not Working If:
- Console shows old values
- No `updating email hook reference...` message
- Values don't match what you set

## Creating TODOs to Test Email Sending

Once settings are correct, create a TODO to actually trigger an email:

1. **Click on today's date** in the calendar
2. **Create an event:** 
   - Title: `TO DO: Test reminder`
   - (Make sure it starts with "TO DO:")
3. **Save it**

Within 60 seconds, you should see:
```javascript
📅 Time for daily reminder - sending email...
✅ Daily reminder sent successfully
```

And you'll receive an email! 🎉

## Full Test Checklist

- [ ] App restarted
- [ ] Browser console open
- [ ] Settings configured
- [ ] Reminder time set to current time
- [ ] Advance reminders enabled
- [ ] Settings saved/modal closed
- [ ] Console shows new values within 60 seconds
- [ ] `reminderTime` matches what you set
- [ ] `advanceReminders` is `true`
- [ ] Optional: Create TODO to test actual email

## Debug localStorage (Optional)

Want to see exactly what's saved?

Open the debug page:
```bash
open /Users/ievak/happy-tomato/debug-localstorage.html
```

Click **"Start Watching"** and make changes in the app. You'll see localStorage update in real-time!

## Still Having Issues?

If the console STILL shows old values after:
- ✅ Restarting the app
- ✅ Hard refreshing the browser
- ✅ Clearing cache

Then take a screenshot of:
1. Your email settings modal (showing what you set)
2. Browser console (showing what it's using)
3. localStorage debug page (showing what's saved)

This will help diagnose what's going wrong.

## Expected Timeline

- **0:00** - Set settings to current time, save
- **0:05** - Close modal, wait
- **0:30** - Console shows "updating email hook reference"
- **1:00** - Console shows reminder check with NEW values
- **1:00** - If you have TODOs, email sends!

Good luck! 🚀

