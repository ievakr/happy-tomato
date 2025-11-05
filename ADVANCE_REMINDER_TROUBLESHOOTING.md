# Advance Reminder Not Firing - Troubleshooting Guide

## Problem
You set a TODO for 1 day in advance, but didn't receive an email notification yesterday. Manual email test works fine.

## System Overview

Your email system uses **Firebase Cloud Functions** with **SendGrid**, not the browser-based EmailJS system. This means:

- ✅ Emails are sent from Firebase servers (not your browser)
- ✅ Works even when you're not using the app
- ✅ Runs every hour automatically
- ⚠️  Requires checking Firebase logs to debug

## Quick Diagnostic Steps

### Step 1: Check Firebase Logs

The advance reminder function logs detailed information. Check the logs:

```bash
# View recent logs
firebase functions:log --only sendAdvanceReminders

# Or in Firebase Console:
# https://console.firebase.google.com/project/YOUR_PROJECT/functions/logs
```

**What to look for:**
- `🔍 Checking for advance reminders to send...` - Function is running
- `👤 Checking user: your@email.com` - Your user was found
- `⏰ Not time yet` - Wrong hour
- `⚠️ Already sent advance reminder today` - Already sent
- `⚠️ No TODOs found for YYYY-MM-DD` - No TODOs on target date
- `✅ Found X TODO(s) for target date` - TODOs found
- `📧 Sending X-day advance reminder` - Email being sent

### Step 2: Verify Your Settings in Firestore

Check your email preferences in Firebase Console:

1. Go to Firestore Database
2. Open `emailPreferences` collection
3. Find your user document (your user ID)
4. Verify these fields:

```javascript
{
  enabled: true,                    // Must be true
  advanceReminders: true,           // Must be true
  advanceDays: 1,                   // Should be 1 (not 3)
  reminderTime: "09:00",            // Your preferred time
  userEmail: "your@email.com",
  userName: "Your Name",
  lastAutoAdvanceReminderSent: ..., // Timestamp of last send
}
```

**Common Issues:**
- ❌ `advanceDays` is missing or set to 3 instead of 1
- ❌ `advanceReminders` is false or missing
- ❌ `lastAutoAdvanceReminderSent` shows today's date (already sent)

### Step 3: Check Your TODO Date

The advance reminder looks for TODOs on a **specific date**:

- If `advanceDays = 1` and today is **Oct 30**
- It looks for TODOs on **Oct 31** (tomorrow)
- It will NOT send if your TODO is on Nov 1 or any other date

**Verify:**
1. Go to Firestore → `events` collection
2. Find your TODO event
3. Check the `day` field (should be a timestamp)
4. Confirm it matches: Today + advanceDays

### Step 4: Check Timing

The function runs **every hour** at minute 0 (e.g., 09:00, 10:00, 11:00).

**Example:**
- Your `reminderTime` is set to `09:00`
- Function checks at 09:00, 10:00, 11:00, etc.
- At 09:00, it checks: "Is it 09:00?" → Yes → Proceed
- At 10:00, it checks: "Is it 09:00?" → No → Skip

**Important:** The function only sends **once per day**. If you:
- Set reminder time to 09:00
- It's now 10:00
- Already sent at 09:00
- Result: No more reminders today

## Most Likely Causes

### Cause #1: Wrong `advanceDays` Value

**Problem:** Your setting shows "1 day in advance" but Firestore has `advanceDays: 3`

**Fix:**
1. Open your app
2. Go to email settings
3. Change advance days to something else (e.g., 2)
4. Save
5. Change back to 1
6. Save again
7. Check Firestore to confirm it's now 1

### Cause #2: Already Sent Today

**Problem:** The function already sent a reminder today at your scheduled time

**Check:**
- Look at `lastAutoAdvanceReminderSent` in Firestore
- If it shows today's date, you already got the reminder

**Fix:**
- Wait until tomorrow for the next reminder
- OR manually clear the timestamp in Firestore for testing

### Cause #3: TODO Date Mismatch

**Problem:** Your TODO is not exactly 1 day from yesterday

**Example:**
- Yesterday was Oct 29
- Your TODO is on Oct 31 (2 days from Oct 29)
- Advance reminder looked for Oct 30 (1 day from Oct 29)
- No match → No email

**Fix:**
- Create a TODO for exactly tomorrow (today + 1 day)
- Wait for the next scheduled reminder time

### Cause #4: TODO Not Recognized

**Problem:** The TODO doesn't match the expected format

**Requirements:**
- Event must have `isRecurringTodo: true`, OR
- `title` starts with "TO DO:", OR
- `toDo` field starts with "TO DO:"
- Event must NOT be `completed: true`

**Fix:**
- Check your TODO in Firestore
- Ensure it has one of the above properties
- Ensure `completed` is false or missing

## Testing the Fix

### Option A: Wait for Next Scheduled Time

1. Verify your settings are correct
2. Create a TODO for tomorrow (today + 1 day)
3. Wait for your scheduled reminder time
4. Check Firebase logs
5. Check your email

### Option B: Test Immediately (Advanced)

You can temporarily modify the function to test:

1. Change `advanceDays` to 0 in your Firestore document
2. Create a TODO for today
3. Wait for the next hour (e.g., if it's 10:30, wait until 11:00)
4. Check logs and email
5. Change `advanceDays` back to 1

### Option C: Use the Diagnostic Script

I've created a diagnostic script that simulates the function logic:

```bash
cd /Users/ievak/happy-tomato/functions

# First, download your service account key:
# Firebase Console → Project Settings → Service Accounts → Generate New Private Key
# Save as serviceAccountKey.json in functions/ folder

# Run diagnosis
node diagnose-advance-reminders.js
```

This will show you exactly what the function sees and why it's not sending.

## Enhanced Logging

I've added detailed logging to your Cloud Function. After deploying, you'll see:

```
🔍 Checking for advance reminders to send...
⏰ Current time in Vilnius: 2025-10-30 09:00:00 (Hour: 9)

👤 Checking user: your@email.com
   Settings: advanceDays=1, reminderTime=09:00
   ✅ It's the right hour!
   ✅ Last sent: 2025-10-29 09:00:15 (not today)
   🎯 Looking for TODOs on 2025-10-31 (1 days from now)
   ✅ Found 2 TODO(s) for target date
📧 Sending 1-day advance reminder to your@email.com
✅ Email sent to your@email.com
```

## Deploy the Enhanced Logging

```bash
cd /Users/ievak/happy-tomato/functions
firebase deploy --only functions:sendAdvanceReminders
```

Then check the logs:

```bash
firebase functions:log --only sendAdvanceReminders
```

## Quick Fixes

### Fix #1: Clear "Already Sent" Timestamp

If you want to test immediately:

1. Go to Firestore Console
2. Open `emailPreferences` → your user document
3. Delete the `lastAutoAdvanceReminderSent` field
4. Wait for the next hour
5. Check logs

### Fix #2: Force Correct Settings

Manually set your Firestore document:

```javascript
// In Firestore Console, set these exact values:
{
  enabled: true,
  advanceReminders: true,
  advanceDays: 1,  // Make sure this is 1, not 3
  reminderTime: "09:00",  // Your preferred time
  userEmail: "your@email.com",
  userName: "Your Name"
}
```

### Fix #3: Create Test TODO

Create a TODO for exactly tomorrow:

1. Open your app
2. Click on tomorrow's date
3. Create a TODO (must have "TO DO:" in title)
4. Ensure it's not marked as completed
5. Wait for your scheduled reminder time

## Understanding the Logic

The function checks these conditions **in order**:

1. ✅ Is `enabled` true?
2. ✅ Is `advanceReminders` true?
3. ✅ Is current hour = reminder hour?
4. ✅ NOT already sent today?
5. ✅ Are there TODOs on target date (today + advanceDays)?

**All must be true** to send an email.

## Common Mistakes

### Mistake #1: Expecting Immediate Send

The function runs **every hour**. If your reminder time is 09:00 and it's now 09:30, you need to wait until 10:00 for the next check (but it won't send because it's not 09:00).

**Solution:** Set your reminder time to the current hour + 1 for testing.

### Mistake #2: Wrong Date Calculation

If you set a TODO for "tomorrow" at 11:00 PM, and the function runs at 9:00 AM, it's calculating from 9:00 AM, not 11:00 PM.

**Solution:** Use the diagnostic script to see exactly what date it's looking for.

### Mistake #3: Multiple TODOs on Different Dates

Having TODOs on multiple dates doesn't matter. The function only looks at the **specific target date** (today + advanceDays).

**Solution:** Create a TODO on the exact target date.

## Next Steps

1. **Deploy the enhanced logging:**
   ```bash
   cd /Users/ievak/happy-tomato/functions
   firebase deploy --only functions:sendAdvanceReminders
   ```

2. **Check your Firestore settings** (especially `advanceDays`)

3. **Create a test TODO** for tomorrow

4. **Wait for your scheduled time** (or set it to next hour)

5. **Check Firebase logs:**
   ```bash
   firebase functions:log --only sendAdvanceReminders
   ```

6. **Check your email** (including spam folder)

## Still Not Working?

If after all this it's still not working, run the diagnostic script and share the output. It will show exactly what the function sees and why it's not sending.

```bash
cd /Users/ievak/happy-tomato/functions
node diagnose-advance-reminders.js
```

The output will tell you exactly what's wrong.



