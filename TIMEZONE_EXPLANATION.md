# ⏰ Timezone Explanation

## The 2-Hour Difference

You're seeing a 2-hour difference because:

**UTC (Coordinated Universal Time):** The standard time used by computers  
**Vilnius Time:** UTC+2 (2 hours ahead of UTC)

### Example from Your Logs

```
UTC time:     2025-10-30T09:00:16Z  (9:00 AM UTC)
Vilnius time: 2025-10-30 11:00:16   (11:00 AM Vilnius)
                          ↑
                    2 hours ahead
```

## Why This Matters for Email Reminders

### Your Firestore Timestamps

When you see: `2025-10-30T09:22:58.047Z`

- The **Z** means UTC (Zulu time)
- This is **09:22 UTC**
- Which is **11:22 in Vilnius** (your local time)

### Your Reminder Time Setting

**Question:** What time do you see in your app for "Reminder time"?

The confusion might be:
1. You set "09:00" thinking it's 9:00 AM Vilnius time
2. But it might be stored/interpreted as 9:00 AM UTC
3. Which would actually be 11:00 AM Vilnius time

**OR:**

1. You set "18:00" (6:00 PM)
2. It's correctly stored as 18:00 Vilnius time
3. The function runs at 18:00 Vilnius = 16:00 UTC

## What the Logs Show

From your logs, the function successfully sent an email when:

**UTC:** `2025-10-28T16:00:04` (4:00 PM UTC)  
**Vilnius:** `2025-10-28 18:00:04` (6:00 PM Vilnius)

This suggests your reminder time is set to **18:00 (6:00 PM) Vilnius time**.

## How to Check Your Settings

### In Your App
1. Open email settings (📧 button)
2. Look at "Reminder time"
3. What time does it show?

### In Firestore Console
```bash
firebase open firestore
```

1. Go to `emailPreferences` collection
2. Find your user document
3. Look at the `reminderTime` field
4. It should show something like `"18:00"` or `"09:00"`

## The Cloud Function Timezone

The Cloud Function is configured to use **Europe/Vilnius** timezone:

```javascript
dayjs.tz.setDefault("Europe/Vilnius");
```

And the schedule is:
```javascript
.schedule("0 * * * *")  // Every hour at minute 0
.timeZone("Europe/Vilnius")
```

So the function:
1. Runs every hour at minute 0 (e.g., 09:00, 10:00, 11:00)
2. Uses Vilnius timezone
3. Compares current hour with your `reminderTime` hour
4. Only sends email when they match

## Why You Didn't Get Email Yesterday

Based on the logs, at **Oct 29, 17:00 Vilnius time** (5:00 PM):

```
Found 0 events for ieva.krisciunaite94@gmail.com
```

You had no events in your database. So even when the function ran at 18:00 (your reminder time), there were no TODOs to send.

## Current Time Check

Right now (when you sent that message):

**Your app showed:** `2025-10-30T09:22:58.047Z` (UTC)  
**Vilnius time:** `2025-10-30T11:22:58` (11:22 AM)

So it's currently **11:22 AM** in Vilnius.

If your reminder time is set to 18:00 (6:00 PM), the function will run in about **6.5 hours**.

## What to Do Now

### 1. Verify Your Reminder Time

Check what time is set in your app. Is it:
- 09:00 (9:00 AM)?
- 18:00 (6:00 PM)?
- Something else?

### 2. Create a TODO for Tomorrow

Create a TODO for **Oct 31** (tomorrow) - do this NOW.

### 3. Wait for Your Reminder Time

If your reminder time is 18:00, wait until 6:00 PM today.

### 4. Check Logs After Reminder Time

```bash
firebase functions:log --only sendAdvanceReminders -n 20
```

The enhanced logging will show:
```
👤 Checking user: ieva.krisciunaite94@gmail.com
   Settings: advanceDays=1, reminderTime=18:00
   ✅ It's the right hour!
   🎯 Looking for TODOs on 2025-10-31 (1 days from now)
```

### 5. Check Your Email

You should receive an email at your configured reminder time.

## Summary

✅ **Vilnius is UTC+2** (2 hours ahead)  
✅ **Function uses Vilnius timezone**  
✅ **Your reminder time is likely 18:00 (6:00 PM)**  
⏰ **Current time: ~11:22 AM Vilnius**  
📧 **Next check: 18:00 (6:00 PM) today**

Create a TODO for tomorrow and wait for 18:00! 🎯

## If You Want Morning Reminders

If you want to receive reminders in the morning instead of evening:

1. Open your app
2. Go to email settings
3. Change reminder time to 09:00 (9:00 AM)
4. Save
5. The function will then send emails at 9:00 AM Vilnius time

The function will automatically use Vilnius timezone, so you don't need to worry about UTC conversion!



