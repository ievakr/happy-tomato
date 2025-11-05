# Fix Advance Reminder - Quick Start (5 Minutes)

## TL;DR - Do This Now

```bash
# 1. Deploy enhanced logging (2 min)
cd /Users/ievak/happy-tomato/functions
firebase deploy --only functions:sendAdvanceReminders

# 2. Check what happened yesterday (1 min)
firebase functions:log --only sendAdvanceReminders --since 2d | grep "advanceDays\|Looking for\|No TODOs"

# 3. Check your settings (1 min)
open https://console.firebase.google.com/project/happytomato-c4fed/firestore/data/emailPreferences

# Look for advanceDays field - is it 1 or 3?
```

## Most Likely Problem

Your Firestore database has `advanceDays: 3` but you think it's set to 1.

**Result:** Function looks for TODOs 3 days ahead, not 1 day ahead.

## Quick Fix

### Option 1: Fix in App (Recommended)

1. Open your Happy Tomato app
2. Click the 📧 email button
3. Change "Days in advance" to **2**
4. Click "Save Settings"
5. Change back to **1**
6. Click "Save Settings" again
7. Verify in Firestore (link above)

### Option 2: Fix in Firestore (Advanced)

1. Open Firestore Console (link above)
2. Find your user document in `emailPreferences`
3. Edit the `advanceDays` field
4. Change from `3` to `1`
5. Save

## Verify the Fix

```bash
# Run diagnostic script
cd /Users/ievak/happy-tomato/functions
node diagnose-advance-reminders.js
```

**Expected output:**
```
👤 User: your@email.com
   Settings: advanceDays=1, reminderTime=09:00
   🎯 Looking for TODOs on 2025-10-31 (1 days from now)
   ✅ Found X TODO(s) for target date
   ✅ WILL SEND REMINDER
```

## Test Tomorrow

1. Create a TODO for tomorrow
2. Wait for your reminder time (e.g., 09:00)
3. Check logs:
   ```bash
   firebase functions:log --only sendAdvanceReminders --follow
   ```
4. Check your email

## What the Logs Will Show

### ✅ Good (Working)
```
👤 Checking user: your@email.com
   Settings: advanceDays=1, reminderTime=09:00
   ✅ It's the right hour!
   🎯 Looking for TODOs on 2025-10-31 (1 days from now)
   ✅ Found 2 TODO(s) for target date
📧 Sending 1-day advance reminder to your@email.com
✅ Email sent
```

### ❌ Bad (Wrong advanceDays)
```
👤 Checking user: your@email.com
   Settings: advanceDays=3, reminderTime=09:00
   🎯 Looking for TODOs on 2025-11-02 (3 days from now)
   ⚠️  No TODOs found for 2025-11-02
   📋 All TODO dates:
      2025-10-31: 2 TODO(s)  ← Your TODOs are here!
```

## Why Yesterday Failed

**Most likely scenario:**

```
Yesterday (Oct 29):
  Function looked for TODOs on Nov 1 (Oct 29 + 3 days)
  Your TODO was on Oct 30 (Oct 29 + 1 day)
  No match → No email
```

**After fix:**

```
Today (Oct 30):
  Function looks for TODOs on Oct 31 (Oct 30 + 1 day)
  Your TODO is on Oct 31
  Match! → Email sent ✅
```

## Files Created for You

### Quick Reference
- **FIX_ADVANCE_REMINDER_NOW.md** (this file) - Quick start
- **QUICK_DEBUG_COMMANDS.md** - All commands

### Detailed Guides
- **ADVANCE_REMINDER_FIX_SUMMARY.md** - Complete summary
- **ADVANCE_REMINDER_TROUBLESHOOTING.md** - Step-by-step troubleshooting
- **ADVANCE_REMINDER_EXPLAINED.md** - Visual explanation
- **ADVANCE_REMINDER_DIAGRAM.md** - Diagrams and flowcharts

### Tools
- **diagnose-advance-reminders.js** - Diagnostic script

## Need More Help?

### See detailed logs from yesterday:
```bash
firebase functions:log --only sendAdvanceReminders --since 2d
```

### Run full diagnosis:
```bash
cd /Users/ievak/happy-tomato/functions
node diagnose-advance-reminders.js
```

### Read the guides:
- Start with `ADVANCE_REMINDER_FIX_SUMMARY.md`
- Then `ADVANCE_REMINDER_EXPLAINED.md` for visual explanation

## Summary

1. **Deploy** enhanced logging
2. **Check** Firestore for `advanceDays` value
3. **Fix** if it's 3 instead of 1
4. **Test** tomorrow at your reminder time

The enhanced logging will tell you exactly what's happening! 🎯



