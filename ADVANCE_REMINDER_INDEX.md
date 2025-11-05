# Advance Reminder Documentation Index

## 🚨 Start Here

**Problem:** Advance email notification didn't fire yesterday, even though manual test works.

**Quick Fix:** [FIX_ADVANCE_REMINDER_NOW.md](FIX_ADVANCE_REMINDER_NOW.md) (5 minutes)

## 📚 Documentation Structure

### 1. Quick Start (5 minutes)
**File:** [FIX_ADVANCE_REMINDER_NOW.md](FIX_ADVANCE_REMINDER_NOW.md)
- TL;DR commands
- Most likely problem
- Quick fix steps
- How to verify

**Use when:** You want to fix it NOW without reading details.

---

### 2. Command Reference (2 minutes)
**File:** [QUICK_DEBUG_COMMANDS.md](QUICK_DEBUG_COMMANDS.md)
- All commands in one place
- Deploy, logs, diagnostics
- Firebase Console links
- Testing workflow

**Use when:** You need to run commands but don't remember syntax.

---

### 3. Complete Summary (10 minutes)
**File:** [ADVANCE_REMINDER_FIX_SUMMARY.md](ADVANCE_REMINDER_FIX_SUMMARY.md)
- Problem analysis
- What I changed
- Action steps
- Testing checklist
- Expected results

**Use when:** You want to understand what was done and why.

---

### 4. Troubleshooting Guide (15 minutes)
**File:** [ADVANCE_REMINDER_TROUBLESHOOTING.md](ADVANCE_REMINDER_TROUBLESHOOTING.md)
- Diagnostic steps
- Check settings
- Check logs
- Common issues
- Detailed fixes

**Use when:** Quick fix didn't work and you need deeper investigation.

---

### 5. Visual Explanation (10 minutes)
**File:** [ADVANCE_REMINDER_EXPLAINED.md](ADVANCE_REMINDER_EXPLAINED.md)
- Timeline diagrams
- Example scenarios
- Step-by-step process
- Why yesterday failed

**Use when:** You want to understand HOW the system works.

---

### 6. Diagrams & Flow Charts (5 minutes)
**File:** [ADVANCE_REMINDER_DIAGRAM.md](ADVANCE_REMINDER_DIAGRAM.md)
- System architecture
- Data flow
- Timeline examples
- Visual debugging

**Use when:** You're a visual learner and want to see the flow.

---

## 🛠️ Tools

### Diagnostic Script
**File:** `functions/diagnose-advance-reminders.js`

**What it does:**
- Connects to your Firestore
- Simulates function logic
- Shows exactly what function sees
- Explains why emails would/wouldn't send

**How to use:**
```bash
cd /Users/ievak/happy-tomato/functions
node diagnose-advance-reminders.js
```

**Prerequisites:**
- Download service account key from Firebase Console
- Save as `serviceAccountKey.json` in `functions/` folder

---

### Enhanced Logging
**File:** `functions/index.js` (modified)

**What it does:**
- Logs user being checked
- Shows settings (advanceDays, reminderTime)
- Shows target date calculation
- Lists all TODO dates
- Explains why sending/not sending

**How to deploy:**
```bash
cd /Users/ievak/happy-tomato/functions
firebase deploy --only functions:sendAdvanceReminders
```

**How to view:**
```bash
firebase functions:log --only sendAdvanceReminders
```

---

## 🎯 Common Scenarios

### Scenario 1: "I want to fix it NOW"
1. Read: [FIX_ADVANCE_REMINDER_NOW.md](FIX_ADVANCE_REMINDER_NOW.md)
2. Run the 3 commands
3. Fix advanceDays if needed
4. Test tomorrow

### Scenario 2: "I want to understand what happened"
1. Read: [ADVANCE_REMINDER_EXPLAINED.md](ADVANCE_REMINDER_EXPLAINED.md)
2. Look at timeline diagrams
3. Check which scenario matches yours
4. Apply the fix

### Scenario 3: "I want to debug it myself"
1. Read: [QUICK_DEBUG_COMMANDS.md](QUICK_DEBUG_COMMANDS.md)
2. Deploy enhanced logging
3. Run diagnostic script
4. Read the output
5. Fix based on findings

### Scenario 4: "Quick fix didn't work"
1. Read: [ADVANCE_REMINDER_TROUBLESHOOTING.md](ADVANCE_REMINDER_TROUBLESHOOTING.md)
2. Follow step-by-step diagnostic
3. Check Firestore settings
4. Check Firebase logs
5. Run diagnostic script
6. Apply detailed fixes

### Scenario 5: "I want complete understanding"
1. Read: [ADVANCE_REMINDER_FIX_SUMMARY.md](ADVANCE_REMINDER_FIX_SUMMARY.md) - Overview
2. Read: [ADVANCE_REMINDER_EXPLAINED.md](ADVANCE_REMINDER_EXPLAINED.md) - How it works
3. Read: [ADVANCE_REMINDER_DIAGRAM.md](ADVANCE_REMINDER_DIAGRAM.md) - Visual flow
4. Read: [ADVANCE_REMINDER_TROUBLESHOOTING.md](ADVANCE_REMINDER_TROUBLESHOOTING.md) - Deep dive
5. Use: Diagnostic script - Hands-on testing

---

## 📋 Quick Reference

### Most Likely Problem
`advanceDays` in Firestore is **3** instead of **1**

### Quick Check
```bash
# Check logs from yesterday
firebase functions:log --only sendAdvanceReminders --since 2d | grep "advanceDays"

# Open Firestore
open https://console.firebase.google.com/project/happytomato-c4fed/firestore/data/emailPreferences
```

### Quick Fix
1. Open app → Email settings
2. Change advance days to 2, save
3. Change to 1, save
4. Verify in Firestore

### Quick Test
```bash
cd /Users/ievak/happy-tomato/functions
node diagnose-advance-reminders.js
```

---

## 🔍 What to Check

### 1. Firestore Settings
**Location:** `emailPreferences/{userId}`

**Required fields:**
```javascript
{
  enabled: true,
  advanceReminders: true,
  advanceDays: 1,  // ← Check this!
  reminderTime: "09:00",
  userEmail: "your@email.com"
}
```

### 2. Firebase Logs
**Command:** `firebase functions:log --only sendAdvanceReminders --since 2d`

**Look for:**
- `advanceDays=1` or `advanceDays=3`
- `Looking for TODOs on YYYY-MM-DD`
- `Found X TODO(s)` or `No TODOs found`

### 3. TODO Format
**Location:** `events/{eventId}`

**Required:**
- `title` starts with "TO DO:" OR
- `isRecurringTodo: true` OR
- `toDo` field starts with "TO DO:"
- `completed: false` (or missing)

---

## 💡 Key Concepts

### Target Date Calculation
```
targetDate = today + advanceDays

Examples:
  Oct 30 + 1 = Oct 31
  Oct 30 + 3 = Nov 2
```

### Function Timing
- Runs every hour at minute 0
- Only sends at your configured reminder hour
- Only sends once per day

### Matching Logic
- Function looks for TODOs on EXACT target date
- Not "around" target date
- Not "within X days"
- EXACT date match only

---

## 🚀 Deployment

### Deploy Enhanced Logging
```bash
cd /Users/ievak/happy-tomato/functions
firebase deploy --only functions:sendAdvanceReminders
```

**Time:** ~2 minutes

**What it does:**
- Updates Cloud Function with enhanced logging
- No downtime
- Logs will be more detailed

---

## 📊 Expected Results

### Before Fix
```
Settings: advanceDays=3
Looking for TODOs on 2025-11-02 (3 days from now)
⚠️  No TODOs found for 2025-11-02
```

### After Fix
```
Settings: advanceDays=1
Looking for TODOs on 2025-10-31 (1 days from now)
✅ Found 2 TODO(s) for target date
📧 Sending 1-day advance reminder
✅ Email sent
```

---

## 📞 Support

### Self-Service
1. Run diagnostic script
2. Check Firebase logs
3. Read troubleshooting guide
4. Check Firestore settings

### Documentation
- All guides in this repository
- Start with quick start guide
- Progress to detailed guides as needed

### Tools
- Diagnostic script (instant feedback)
- Enhanced logging (real-time debugging)
- Firebase Console (view data)

---

## ✅ Success Checklist

- [ ] Enhanced logging deployed
- [ ] Firestore settings checked
- [ ] `advanceDays` is 1 (not 3)
- [ ] Yesterday's logs reviewed
- [ ] Diagnostic script run
- [ ] Test TODO created for tomorrow
- [ ] Waiting for reminder time
- [ ] Logs checked at reminder time
- [ ] Email received

---

## 📖 Reading Order

### For Quick Fix (15 minutes total)
1. FIX_ADVANCE_REMINDER_NOW.md (5 min)
2. QUICK_DEBUG_COMMANDS.md (2 min)
3. Run diagnostic script (2 min)
4. Apply fix (1 min)
5. Test tomorrow (5 min)

### For Understanding (45 minutes total)
1. ADVANCE_REMINDER_FIX_SUMMARY.md (10 min)
2. ADVANCE_REMINDER_EXPLAINED.md (10 min)
3. ADVANCE_REMINDER_DIAGRAM.md (5 min)
4. ADVANCE_REMINDER_TROUBLESHOOTING.md (15 min)
5. QUICK_DEBUG_COMMANDS.md (2 min)
6. Hands-on testing (3 min)

### For Deep Dive (2 hours total)
1. Read all documentation
2. Study the code changes
3. Run diagnostic script
4. Check Firestore manually
5. Review Firebase logs
6. Test multiple scenarios
7. Understand the complete system

---

## 🎯 Bottom Line

**Problem:** `advanceDays` is probably 3 instead of 1

**Fix:** Update in app, verify in Firestore

**Verify:** Run diagnostic script

**Test:** Wait for tomorrow's reminder time

**Time:** 5 minutes to fix, 24 hours to verify

---

## 📁 File Structure

```
/Users/ievak/happy-tomato/
├── functions/
│   ├── index.js (modified - enhanced logging)
│   └── diagnose-advance-reminders.js (new - diagnostic tool)
│
├── FIX_ADVANCE_REMINDER_NOW.md (quick start)
├── QUICK_DEBUG_COMMANDS.md (command reference)
├── ADVANCE_REMINDER_FIX_SUMMARY.md (complete summary)
├── ADVANCE_REMINDER_TROUBLESHOOTING.md (detailed guide)
├── ADVANCE_REMINDER_EXPLAINED.md (visual explanation)
├── ADVANCE_REMINDER_DIAGRAM.md (diagrams)
└── ADVANCE_REMINDER_INDEX.md (this file)
```

---

## 🏁 Next Steps

1. **Right now:** Read [FIX_ADVANCE_REMINDER_NOW.md](FIX_ADVANCE_REMINDER_NOW.md)
2. **In 5 minutes:** Deploy enhanced logging and check settings
3. **In 10 minutes:** Run diagnostic script
4. **Tomorrow:** Test at your reminder time

Good luck! 🍀



