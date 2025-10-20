# 🕐 Fixed: Cloud Functions Timezone Issue

## The Problem

Firebase Cloud Functions were running with the wrong timezone. Even though `.timeZone("Europe/Vilnius")` was set in the schedule, the code inside was still using UTC time.

## Root Cause

The `.timeZone()` configuration only affects **when the function is triggered**, but the code inside still runs with **UTC time** unless `dayjs` is properly configured with timezone support.

### What Was Wrong

```javascript
// BEFORE
const dayjs = require("dayjs");

const now = dayjs(); // ❌ Uses UTC, not Vilnius time!
const currentHour = now.hour(); // ❌ Returns UTC hour
```

## The Solution

### 1. Import and Configure Timezone Plugins

```javascript
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

// Configure dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

// Set default timezone to Europe/Vilnius
dayjs.tz.setDefault("Europe/Vilnius");
```

### 2. Use `dayjs.tz()` Instead of `dayjs()`

```javascript
// AFTER
const now = dayjs.tz(new Date(), "Europe/Vilnius"); // ✅ Uses Vilnius time!
const currentHour = now.hour(); // ✅ Returns Vilnius hour
```

### 3. Updated All Date Operations

Changed all date operations to use Vilnius timezone:

**In `sendDailyReminders` function:**
```javascript
const now = dayjs.tz(new Date(), "Europe/Vilnius");
const lastSent = prefs.lastAutoReminderSent ?
  dayjs.tz(prefs.lastAutoReminderSent.toDate(), "Europe/Vilnius") : null;
```

**In `sendAdvanceReminders` function:**
```javascript
const now = dayjs.tz(new Date(), "Europe/Vilnius");
const lastSent = prefs.lastAutoAdvanceReminderSent ?
  dayjs.tz(prefs.lastAutoAdvanceReminderSent.toDate(), "Europe/Vilnius") : null;
```

**In helper functions:**
```javascript
// getDueAndOverdueTodos
const today = dayjs.tz(new Date(), "Europe/Vilnius").startOf("day");
const eventDate = dayjs.tz(evt.day, "Europe/Vilnius").startOf("day");

// getTodosInAdvance
const targetDate = dayjs.tz(new Date(), "Europe/Vilnius")
    .add(days, "days")
    .startOf("day");
const eventDate = dayjs.tz(evt.day, "Europe/Vilnius").startOf("day");
```

### 4. Fixed Timezone in Schedule

Also fixed the advance reminders schedule which still had `America/New_York`:

```javascript
// BEFORE
exports.sendAdvanceReminders = functions.pubsub
    .schedule("0 * * * *")
    .timeZone("America/New_York") // ❌ Wrong!

// AFTER
exports.sendAdvanceReminders = functions.pubsub
    .schedule("0 * * * *")
    .timeZone("Europe/Vilnius") // ✅ Correct!
```

### 5. Added Better Logging

Added timezone-aware logging to help debug:

```javascript
console.log(
    `⏰ Current time in Vilnius: ` +
    `${now.format("YYYY-MM-DD HH:mm:ss")} (Hour: ${currentHour})`,
);

console.log(
    `🔍 Looking for TODOs due on ${targetDate.format("YYYY-MM-DD")} ` +
    `(${days} days from now)`,
);
```

## Changes Made

### Files Modified

1. **functions/index.js**
   - Added timezone plugin imports
   - Configured dayjs with UTC and timezone plugins
   - Set default timezone to Europe/Vilnius
   - Updated all `dayjs()` calls to `dayjs.tz()`
   - Fixed advance reminders timezone from America/New_York to Europe/Vilnius
   - Added better logging with timezone info

## Testing

After deployment, check Firebase Cloud Functions logs:

1. **At the top of each hour**, you should see:
   ```
   ⏰ Current time in Vilnius: 2025-10-20 21:00:00 (Hour: 21)
   ```

2. **When checking for advance todos:**
   ```
   🔍 Looking for TODOs due on 2025-10-21 (1 days from now)
   ```

3. **When a user's reminder time matches:**
   ```
   📧 Sending 1-day advance reminder to user@email.com (1 TODOs)
   ```

## Deployment

```bash
firebase deploy --only functions
```

## Expected Behavior

Now the Cloud Functions will:
- ✅ Run at the correct hour in Vilnius timezone
- ✅ Compare dates correctly using Vilnius time
- ✅ Send reminders at the user's configured time (in Vilnius timezone)
- ✅ Check if reminders were already sent today (comparing Vilnius dates)

## Important Notes

### Timezone Plugin Dependencies

The dayjs plugins (`utc` and `timezone`) are already included in the `dayjs` npm package, so no additional dependencies were needed.

### Schedule vs Code Timezone

- `.timeZone("Europe/Vilnius")` in the schedule → Controls **when** the function runs
- `dayjs.tz()` in the code → Controls **how** dates are interpreted
- **Both are needed** for correct timezone behavior!

### Future Considerations

If you ever need to support users in different timezones:
1. Store user timezone in their preferences
2. Use `dayjs.tz(date, userTimezone)` for each user
3. Compare times using their local timezone

---

**Status**: ✅ Fixed and Deployed
**Date**: 2025-10-20
**Functions Updated**: 
- `sendDailyReminders`
- `sendAdvanceReminders`
- `getDueAndOverdueTodos`
- `getTodosInAdvance`

