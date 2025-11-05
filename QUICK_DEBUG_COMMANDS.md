# Quick Debug Commands for Advance Reminders

## 🚀 Deploy Enhanced Logging

```bash
cd /Users/ievak/happy-tomato/functions
firebase deploy --only functions:sendAdvanceReminders
```

Wait 2-3 minutes for deployment to complete.

## 📋 View Logs

### View recent logs (last 50 lines)
```bash
firebase functions:log --only sendAdvanceReminders
```

### View logs in real-time (streaming)
```bash
firebase functions:log --only sendAdvanceReminders --follow
```

### View logs from specific time
```bash
firebase functions:log --only sendAdvanceReminders --since 1h
```

## 🔍 Check Current Settings

### View your email preferences in Firestore
```bash
# Open Firebase Console
open https://console.firebase.google.com/project/happytomato-c4fed/firestore/data/emailPreferences
```

Look for your user document and check:
- `enabled: true`
- `advanceReminders: true`
- `advanceDays: 1` (should be 1, not 3)
- `reminderTime: "09:00"` (your preferred time)
- `lastAutoAdvanceReminderSent` (when last email was sent)

## 🧪 Run Diagnostic Script

### Setup (one-time)
```bash
cd /Users/ievak/happy-tomato/functions

# Download service account key:
# 1. Go to https://console.firebase.google.com/project/happytomato-c4fed/settings/serviceaccounts/adminsdk
# 2. Click "Generate New Private Key"
# 3. Save as serviceAccountKey.json in functions/ folder
```

### Run diagnosis
```bash
cd /Users/ievak/happy-tomato/functions
node diagnose-advance-reminders.js
```

This will show you:
- Current time and settings
- Whether it's the right hour
- If already sent today
- All your TODOs and their dates
- Whether an email would be sent

## 🔧 Quick Fixes

### Fix #1: Clear "Already Sent" Timestamp (for testing)

Go to Firestore Console and delete `lastAutoAdvanceReminderSent` field from your user document.

### Fix #2: Force Settings Update

In your app:
1. Open email settings (📧 button)
2. Change advance days to 2
3. Save
4. Change back to 1
5. Save again

### Fix #3: Set Reminder Time to Next Hour (for immediate testing)

1. Check current time: `date`
2. Set reminder time to next hour (e.g., if it's 10:30, set to 11:00)
3. Create a TODO for tomorrow
4. Wait until 11:00
5. Check logs

## 📊 What to Look For in Logs

### ✅ Good Signs
```
🔍 Checking for advance reminders to send...
👤 Checking user: your@email.com
✅ It's the right hour!
✅ Last sent: 2025-10-29 09:00:15 (not today)
🎯 Looking for TODOs on 2025-10-31 (1 days from now)
✅ Found 2 TODO(s) for target date
📧 Sending 1-day advance reminder to your@email.com
✅ Email sent to your@email.com
```

### ⚠️ Warning Signs
```
⏰ Not time yet (wants 9:00, now is 10:00)
→ Wait for the right hour

⚠️ Already sent advance reminder today
→ Wait until tomorrow OR clear timestamp

⚠️ No TODOs found for 2025-10-31
→ Create a TODO for that specific date

No users with advance reminders enabled
→ Check Firestore settings
```

### ❌ Error Signs
```
❌ Failed to send email
→ Check SendGrid configuration

❌ Error in sendAdvanceReminders
→ Check full error message in logs
```

## 🎯 Testing Workflow

### Quick Test (15 minutes)

1. **Deploy enhanced logging:**
   ```bash
   cd /Users/ievak/happy-tomato/functions
   firebase deploy --only functions:sendAdvanceReminders
   ```

2. **Check current time:**
   ```bash
   date
   ```
   Note the hour (e.g., 10:00)

3. **Update settings in app:**
   - Set reminder time to next hour (e.g., 11:00)
   - Set advance days to 1
   - Save settings

4. **Create test TODO:**
   - Open calendar
   - Click tomorrow's date
   - Create TODO with title "TO DO: Test reminder"
   - Save

5. **Wait for next hour** (e.g., wait until 11:00)

6. **Check logs:**
   ```bash
   firebase functions:log --only sendAdvanceReminders --since 5m
   ```

7. **Check email** (including spam folder)

### Diagnostic Test (5 minutes)

1. **Run diagnostic script:**
   ```bash
   cd /Users/ievak/happy-tomato/functions
   node diagnose-advance-reminders.js
   ```

2. **Read the output** - it will tell you exactly what's wrong

3. **Fix the issue** based on the output

4. **Run again** to verify fix

## 📞 Firebase Console Links

### View Functions
```bash
open https://console.firebase.google.com/project/happytomato-c4fed/functions/list
```

### View Logs
```bash
open https://console.firebase.google.com/project/happytomato-c4fed/functions/logs
```

### View Firestore
```bash
open https://console.firebase.google.com/project/happytomato-c4fed/firestore
```

### View SendGrid Settings
```bash
firebase functions:config:get sendgrid
```

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| No logs appearing | Function not deployed - run deploy command |
| "Not time yet" in logs | Set reminder time to next hour |
| "Already sent today" | Clear `lastAutoAdvanceReminderSent` in Firestore |
| "No TODOs found" | Create TODO for tomorrow (today + 1 day) |
| "No users with advance reminders" | Check Firestore - ensure `advanceReminders: true` |
| Email not received | Check spam folder, verify SendGrid config |

## 💡 Pro Tips

1. **Use streaming logs** during testing:
   ```bash
   firebase functions:log --only sendAdvanceReminders --follow
   ```
   Leave this running in a terminal while you test.

2. **Check both functions** if issues persist:
   ```bash
   firebase functions:log
   ```
   This shows logs for all functions.

3. **Verify TODO format** in Firestore:
   - Must have `isRecurringTodo: true` OR
   - `title` starts with "TO DO:" OR
   - `toDo` field starts with "TO DO:"
   - Must NOT have `completed: true`

4. **Time zones matter:**
   - Function uses Europe/Vilnius timezone
   - All dates are calculated in this timezone
   - Your computer's timezone doesn't matter

5. **Function runs every hour:**
   - At minute 0 (e.g., 09:00, 10:00, 11:00)
   - Only sends if current hour matches reminder hour
   - Only sends once per day

## 📝 Next Steps

1. Deploy the enhanced logging
2. Run the diagnostic script
3. Check the logs at your scheduled time
4. Review the troubleshooting guide if issues persist

Good luck! 🍀



