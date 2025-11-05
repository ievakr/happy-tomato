# How Advance Reminders Work - Visual Guide

## The Timeline

```
TODAY          TOMORROW       DAY AFTER
Oct 30         Oct 31         Nov 1
  |              |              |
  |              |              |
  v              v              v
09:00 -----> Looking for ---> [TODO here]
Function       TODOs on         gets
runs           Oct 31          reminder
               (today + 1)
```

## Step-by-Step Process

### 1. Function Runs Every Hour

```
08:00 → Check: Is it 09:00? → No → Skip
09:00 → Check: Is it 09:00? → Yes → Continue
10:00 → Check: Is it 09:00? → No → Skip
11:00 → Check: Is it 09:00? → No → Skip
```

**Key Point:** Function only proceeds at your configured reminder time.

### 2. Check If Already Sent Today

```
lastAutoAdvanceReminderSent: Oct 29, 09:00
Current date: Oct 30, 09:00
Same day? → No → Continue

lastAutoAdvanceReminderSent: Oct 30, 09:00
Current date: Oct 30, 10:00
Same day? → Yes → Skip (already sent)
```

**Key Point:** Only one advance reminder per day.

### 3. Calculate Target Date

```
Today: Oct 30
advanceDays: 1
Target: Oct 30 + 1 = Oct 31

Today: Oct 30
advanceDays: 3
Target: Oct 30 + 3 = Nov 2
```

**Key Point:** Target date is EXACTLY today + advanceDays.

### 4. Find TODOs on Target Date

```
Your TODOs:
- Oct 30: Water plants ❌ (today, not target)
- Oct 31: Fertilize ✅ (matches target!)
- Nov 1: Prune ❌ (not target)

Result: Send email about "Fertilize" only
```

**Key Point:** Only TODOs on the EXACT target date are included.

## Example Scenarios

### Scenario 1: Working Correctly ✅

**Settings:**
- Today: Oct 30, 09:00
- reminderTime: 09:00
- advanceDays: 1
- lastAutoAdvanceReminderSent: Oct 29, 09:00

**TODOs:**
- Oct 31: Water plants

**What Happens:**
1. Function runs at 09:00 ✅
2. Current hour (9) = reminder hour (9) ✅
3. Last sent Oct 29, not today ✅
4. Target date: Oct 31 ✅
5. TODO found on Oct 31 ✅
6. **Email sent!** 📧

### Scenario 2: Wrong Hour ⏰

**Settings:**
- Today: Oct 30, 10:00
- reminderTime: 09:00
- advanceDays: 1

**What Happens:**
1. Function runs at 10:00 ✅
2. Current hour (10) ≠ reminder hour (9) ❌
3. **Skipped - wrong hour**

**Fix:** Wait until tomorrow at 09:00

### Scenario 3: Already Sent ⚠️

**Settings:**
- Today: Oct 30, 09:00
- reminderTime: 09:00
- lastAutoAdvanceReminderSent: Oct 30, 09:00

**What Happens:**
1. Function runs at 09:00 ✅
2. Current hour (9) = reminder hour (9) ✅
3. Last sent Oct 30 = today ❌
4. **Skipped - already sent today**

**Fix:** Wait until tomorrow, or clear timestamp for testing

### Scenario 4: No TODOs on Target Date 📋

**Settings:**
- Today: Oct 30, 09:00
- reminderTime: 09:00
- advanceDays: 1

**TODOs:**
- Oct 30: Water plants (today)
- Nov 1: Fertilize (2 days from now)

**What Happens:**
1. Function runs at 09:00 ✅
2. Current hour (9) = reminder hour (9) ✅
3. Last sent Oct 29, not today ✅
4. Target date: Oct 31 ✅
5. No TODOs on Oct 31 ❌
6. **Skipped - no TODOs on target date**

**Fix:** Create a TODO for Oct 31

### Scenario 5: Wrong advanceDays Setting 🔧

**Settings:**
- Today: Oct 30, 09:00
- reminderTime: 09:00
- advanceDays: 3 (but you think it's 1!)

**TODOs:**
- Oct 31: Water plants

**What Happens:**
1. Function runs at 09:00 ✅
2. Current hour (9) = reminder hour (9) ✅
3. Last sent Oct 29, not today ✅
4. Target date: Nov 2 (Oct 30 + 3) ✅
5. No TODOs on Nov 2 ❌
6. **Skipped - looking at wrong date!**

**Fix:** Update advanceDays to 1 in Firestore

## Why Yesterday Didn't Work

Let's analyze your specific case:

**Yesterday (Oct 29):**
- Your reminder time: Let's say 09:00
- Your advanceDays: 1
- Your TODO: Oct 30 (today)

**What should have happened at Oct 29, 09:00:**
1. Function runs ✅
2. Hour matches ✅
3. Target date: Oct 30 ✅
4. TODO on Oct 30 ✅
5. Should send email ✅

**What probably went wrong:**

### Possibility 1: advanceDays was 3, not 1
```
Oct 29 + 3 = Nov 1
Looking for TODOs on Nov 1
Your TODO is on Oct 30
No match → No email
```

### Possibility 2: Already sent earlier
```
lastAutoAdvanceReminderSent: Oct 29, 08:00
Current: Oct 29, 09:00
Same day → Skip
```

### Possibility 3: Wrong hour
```
reminderTime: 10:00
Current hour: 09:00
Not matching → Skip
```

### Possibility 4: TODO format issue
```
TODO title: "Water plants" (missing "TO DO:" prefix)
isRecurringTodo: false
Not recognized as TODO → Skip
```

## How to Verify What Went Wrong

### Check 1: View Firestore Settings

```javascript
// Your emailPreferences document should show:
{
  enabled: true,
  advanceReminders: true,
  advanceDays: 1,  // ← Check this!
  reminderTime: "09:00",
  lastAutoAdvanceReminderSent: Timestamp(Oct 29, 09:00:15)
}
```

### Check 2: View Firebase Logs

```bash
firebase functions:log --only sendAdvanceReminders --since 2d
```

Look for logs from Oct 29 around your reminder time.

### Check 3: View Your TODO

```javascript
// Your event document should show:
{
  day: Timestamp(Oct 30, 00:00:00),
  title: "TO DO: Water plants",  // ← Must start with "TO DO:"
  completed: false,  // ← Must be false
  userId: "your-user-id"
}
```

## Testing Strategy

### Test 1: Immediate Test (Next Hour)

```
Current time: 10:30
Set reminderTime: 11:00
Create TODO for: tomorrow
Wait until: 11:00
Expected: Email at 11:00
```

### Test 2: Tomorrow Test

```
Current time: any time
Set reminderTime: 09:00
Create TODO for: tomorrow
Wait until: tomorrow 09:00
Expected: Email tomorrow at 09:00
```

### Test 3: Diagnostic Test

```bash
cd functions
node diagnose-advance-reminders.js
```

This simulates the function and shows exactly what it sees.

## The Complete Flow Chart

```
START
  ↓
Is enabled = true? ──No──→ SKIP
  ↓ Yes
Is advanceReminders = true? ──No──→ SKIP
  ↓ Yes
Is current hour = reminder hour? ──No──→ SKIP
  ↓ Yes
Already sent today? ──Yes──→ SKIP
  ↓ No
Calculate target date (today + advanceDays)
  ↓
Find TODOs on target date
  ↓
Any TODOs found? ──No──→ SKIP
  ↓ Yes
Send email
  ↓
Update lastAutoAdvanceReminderSent
  ↓
END
```

## Key Takeaways

1. **Exact Date Matching:** The function looks for TODOs on ONE specific date only
2. **One Per Day:** Only sends once per day at your scheduled time
3. **Hour Precision:** Must run during your scheduled hour (e.g., 09:00-09:59)
4. **Settings Matter:** Check Firestore, not just the app UI
5. **Logs Tell All:** Firebase logs show exactly what happened

## Next Steps

1. **Deploy enhanced logging:**
   ```bash
   cd functions
   firebase deploy --only functions:sendAdvanceReminders
   ```

2. **Check your settings in Firestore**
   - Especially `advanceDays` field

3. **Create a test TODO for tomorrow**

4. **Check logs at your scheduled time:**
   ```bash
   firebase functions:log --only sendAdvanceReminders --follow
   ```

5. **Run diagnostic script:**
   ```bash
   cd functions
   node diagnose-advance-reminders.js
   ```

The enhanced logging will show you exactly what's happening at each step!



