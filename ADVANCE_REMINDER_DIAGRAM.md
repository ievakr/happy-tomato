# Advance Reminder System - Visual Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Cloud Function                   │
│                  sendAdvanceReminders()                      │
│                                                              │
│  Runs: Every hour at minute 0 (e.g., 09:00, 10:00, 11:00)  │
│  Timezone: Europe/Vilnius                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Check Conditions                        │
│                                                              │
│  1. enabled = true?                                          │
│  2. advanceReminders = true?                                 │
│  3. Current hour = reminderTime hour?                        │
│  4. NOT already sent today?                                  │
│  5. TODOs exist on (today + advanceDays)?                    │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
               Yes                     No
                │                       │
                ▼                       ▼
         ┌──────────┐            ┌──────────┐
         │Send Email│            │   Skip   │
         └──────────┘            └──────────┘
                │
                ▼
    ┌──────────────────────┐
    │Update lastSent       │
    │timestamp in Firestore│
    └──────────────────────┘
```

## Data Flow

```
┌──────────────────┐
│   Firestore DB   │
└──────────────────┘
         │
         ├─► emailPreferences/{userId}
         │   ├─ enabled: true
         │   ├─ advanceReminders: true
         │   ├─ advanceDays: 1
         │   ├─ reminderTime: "09:00"
         │   └─ lastAutoAdvanceReminderSent: Timestamp
         │
         └─► events/{eventId}
             ├─ userId: "..."
             ├─ day: Timestamp
             ├─ title: "TO DO: Water plants"
             └─ completed: false
```

## Timeline Example: Why Yesterday Failed

### Scenario: advanceDays was 3 instead of 1

```
Oct 28          Oct 29          Oct 30          Oct 31          Nov 1
  │               │               │               │               │
  │               │               │               │               │
  │           Function        [Your TODO]         │               │
  │           runs at            here             │               │
  │           09:00              │                │               │
  │               │               │               │               │
  │               └───────────────┼───────────────┼───────────────┤
  │                               │               │               │
  │                          Looking for      Looking for     Looking for
  │                          TODOs on         TODOs on        TODOs on
  │                          Nov 1            Nov 2           Nov 3
  │                          (Oct 29+3)       (Oct 30+3)      (Oct 31+3)
  │                               │               │               │
  │                               ▼               ▼               ▼
  │                          No match!       No match!       No match!
  │                          ❌ No email    ❌ No email    ❌ No email
```

**Problem:** Function was looking 3 days ahead, but your TODO was only 1 day ahead!

### Scenario: Correct Settings (advanceDays = 1)

```
Oct 28          Oct 29          Oct 30          Oct 31          Nov 1
  │               │               │               │               │
  │               │               │               │               │
  │           Function        [Your TODO]         │               │
  │           runs at            here             │               │
  │           09:00              │                │               │
  │               │               │               │               │
  │               └───────────────┤               │               │
  │                               │               │               │
  │                          Looking for          │               │
  │                          TODOs on             │               │
  │                          Oct 30               │               │
  │                          (Oct 29+1)           │               │
  │                               │               │               │
  │                               ▼               │               │
  │                          ✅ Match found!      │               │
  │                          📧 Email sent!       │               │
```

**Success:** Function looks 1 day ahead and finds your TODO!

## Hourly Check Pattern

```
Hour    Check?  Reason
────────────────────────────────────────
08:00   ❌      Current hour (8) ≠ reminder hour (9)
09:00   ✅      Current hour (9) = reminder hour (9) → Proceed
10:00   ❌      Current hour (10) ≠ reminder hour (9)
11:00   ❌      Current hour (11) ≠ reminder hour (9)
12:00   ❌      Current hour (12) ≠ reminder hour (9)
...
```

**Key Point:** Function only proceeds during your configured reminder hour.

## "Already Sent" Logic

```
Day 1 (Oct 29)
09:00 → Check: lastSent = Oct 28? → Yes, different day → Send email ✅
09:00 → Update: lastSent = Oct 29, 09:00:15

10:00 → Check: lastSent = Oct 29? → Yes, same day → Skip ⏭️
11:00 → Check: lastSent = Oct 29? → Yes, same day → Skip ⏭️
...

Day 2 (Oct 30)
09:00 → Check: lastSent = Oct 29? → No, different day → Send email ✅
09:00 → Update: lastSent = Oct 30, 09:00:12
```

**Key Point:** Only one email per day, sent at your scheduled hour.

## TODO Matching Logic

```
┌─────────────────────────────────────────────────────────┐
│                    Your Events                          │
├─────────────────────────────────────────────────────────┤
│ Oct 30: "Water plants"        → Today        → ❌ Skip  │
│ Oct 31: "TO DO: Fertilize"    → Tomorrow     → ✅ Match │
│ Nov 1:  "TO DO: Prune"        → 2 days away  → ❌ Skip  │
│ Nov 2:  "Harvest"             → 3 days away  → ❌ Skip  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
                    Target: Oct 31
                    (Today + 1 day)
                            │
                            ▼
                    Only "Fertilize" matches!
                            │
                            ▼
                    Send email with 1 TODO
```

**Key Point:** Only TODOs on the EXACT target date are included.

## TODO Recognition Rules

```
✅ Recognized as TODO:
   ├─ isRecurringTodo: true
   ├─ title: "TO DO: Water plants"
   └─ toDo: "TO DO: Fertilize"

❌ NOT recognized as TODO:
   ├─ title: "Water plants" (no "TO DO:" prefix)
   ├─ title: "Todo: Water plants" (wrong case)
   └─ completed: true (marked as done)
```

## Debug Flow Chart

```
                    Start Debugging
                          │
                          ▼
              ┌───────────────────────┐
              │ Deploy Enhanced       │
              │ Logging               │
              └───────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ Check Firestore       │
              │ Settings              │
              └───────────────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
           advanceDays=1?      advanceDays=3?
                │                   │
               Yes                  No
                │                   │
                ▼                   ▼
        ┌──────────────┐    ┌──────────────┐
        │Check Firebase│    │Fix Settings  │
        │Logs          │    │in App        │
        └──────────────┘    └──────────────┘
                │                   │
                ▼                   │
        ┌──────────────┐           │
        │Run Diagnostic│◄──────────┘
        │Script        │
        └──────────────┘
                │
                ▼
        ┌──────────────┐
        │Read Output   │
        │& Fix Issues  │
        └──────────────┘
                │
                ▼
        ┌──────────────┐
        │Test Tomorrow │
        │at Reminder   │
        │Time          │
        └──────────────┘
```

## Common Issues Visualized

### Issue 1: Wrong advanceDays

```
Setting in App UI:  [1 day in advance]  ← What you see
                           │
                           ▼
Setting in Firestore:  advanceDays: 3   ← What function uses
                           │
                           ▼
Result:  Looking 3 days ahead, not 1!
```

### Issue 2: Time Zone Confusion

```
Your Computer:     10:00 AM (Your local time)
                        │
                        ▼
Firebase Function: 09:00 AM (Europe/Vilnius)
                        │
                        ▼
Result: Function not at your reminder hour yet!
```

### Issue 3: Date Calculation

```
Today (Oct 30)
    │
    ├─ advanceDays = 1 → Oct 31 ✅ (tomorrow)
    ├─ advanceDays = 2 → Nov 1
    └─ advanceDays = 3 → Nov 2

Your TODO: Oct 31

Match only if advanceDays = 1!
```

## Solution Path

```
┌──────────────────────────────────────────────────────────┐
│                    SOLUTION PATH                          │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  1. Deploy Enhanced Logging                              │
│     cd functions && firebase deploy                       │
│                                                           │
│  2. Check Firestore                                       │
│     Verify advanceDays = 1                               │
│                                                           │
│  3. Check Logs                                            │
│     firebase functions:log --since 2d                     │
│                                                           │
│  4. Run Diagnostic                                        │
│     node diagnose-advance-reminders.js                    │
│                                                           │
│  5. Fix Issues                                            │
│     Based on diagnostic output                            │
│                                                           │
│  6. Test                                                  │
│     Wait for next reminder time                           │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## Quick Reference

### Function Trigger
```
Schedule: 0 * * * * (every hour at minute 0)
Timezone: Europe/Vilnius
Runs at:  00:00, 01:00, 02:00, ..., 23:00
```

### Key Firestore Fields
```
emailPreferences/{userId}:
  ├─ enabled: boolean
  ├─ advanceReminders: boolean
  ├─ advanceDays: number (1, 2, 3, etc.)
  ├─ reminderTime: string ("09:00")
  └─ lastAutoAdvanceReminderSent: Timestamp
```

### Target Date Formula
```
targetDate = today + advanceDays

Examples:
  today=Oct 30, advanceDays=1 → Oct 31
  today=Oct 30, advanceDays=2 → Nov 1
  today=Oct 30, advanceDays=3 → Nov 2
```

### Conditions for Sending
```
1. enabled = true                    ✅
2. advanceReminders = true           ✅
3. currentHour = reminderHour        ✅
4. NOT sent today                    ✅
5. TODOs on targetDate exist         ✅
                                     ↓
                              Send Email! 📧
```

## Summary

The most likely issue is that `advanceDays` in Firestore is **3** instead of **1**, causing the function to look for TODOs 3 days ahead instead of 1 day ahead.

**Fix:** Update the setting in your app and verify in Firestore.

**Verify:** Run the diagnostic script to see exactly what the function sees.

**Test:** Wait for your next scheduled reminder time and check the logs.

The enhanced logging will show you exactly what's happening! 🔍



