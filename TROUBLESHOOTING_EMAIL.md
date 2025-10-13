# Email Notification Troubleshooting Guide

## Quick Checklist

Your email notification system won't work unless **ALL** of these conditions are met:

### ✅ **1. EmailJS Configuration (CRITICAL)**
The most common issue is missing environment variables. Check:

- [ ] `.env` file exists in project root
- [ ] File contains these three variables:
  ```env
  REACT_APP_EMAILJS_SERVICE_ID=your_service_id
  REACT_APP_EMAILJS_TEMPLATE_ID=your_template_id
  REACT_APP_EMAILJS_PUBLIC_KEY=your_public_key
  ```
- [ ] App was **restarted** after adding `.env` file
- [ ] Values are from your EmailJS account (not placeholders)

**⚠️ If you don't have a `.env` file, emails WILL NOT work!**

### ✅ **2. Email Settings in App**
Open the email settings (📧 button in header) and verify:

- [ ] Email service status shows "Ready" (green badge)
- [ ] Your email address is entered
- [ ] "Enable email notifications" is turned ON
- [ ] "Daily reminder email" is checked
- [ ] Reminder time is set
- [ ] Test email works (click "Send Test Email")

### ✅ **3. TODOs Must Exist**
The system only sends emails when there are pending TODOs:

- [ ] You have TODOs created in the calendar
- [ ] TODOs have "TO DO:" prefix in their title
- [ ] TODOs are due today or overdue
- [ ] TODOs are NOT marked as completed

### ✅ **4. Timing Requirements**
For automatic reminders:

- [ ] Current time is AFTER your configured reminder time
- [ ] You haven't already received an automatic reminder today
- [ ] The notification service is running (check debug panel)

---

## Step-by-Step Debugging

### Step 1: Check EmailJS Configuration

**Run this in your terminal:**
```bash
cd /Users/ievak/happy-tomato
cat .env
```

**Expected output:**
```
REACT_APP_EMAILJS_SERVICE_ID=service_xxxxx
REACT_APP_EMAILJS_TEMPLATE_ID=template_xxxxx
REACT_APP_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxx
```

**If file not found:**
1. Create `.env` file in project root
2. Follow `EMAIL_SETUP_INSTRUCTIONS.md` to get your EmailJS credentials
3. Add the three environment variables
4. **IMPORTANT:** Restart your app with `npm start`

**If values are there:**
- Open the app
- Click the 📧 email button in header
- Check if "Email Service Status" shows "Ready" (green badge)
- If it shows "Configuration Required", your environment variables aren't being loaded

### Step 2: Test Email Service

1. Open email settings (📧 button)
2. Enter your email address
3. Click "Send Test Email"
4. Check your inbox (and spam folder!)

**If test email fails:**
- Verify EmailJS account is active
- Check EmailJS dashboard for errors
- Ensure email service (Gmail, etc.) is connected in EmailJS
- Verify template ID exists in your EmailJS account

**If test email succeeds:**
Great! The configuration is working. Continue to next step.

### Step 3: Enable Notifications

1. In email settings, check these boxes:
   - ✅ Enable email notifications
   - ✅ Daily reminder email
2. Set a reminder time (e.g., 09:00)
3. Click "Save Settings"

### Step 4: Create TODOs for Testing

The system needs TODOs to send reminders about. Create test TODOs:

**Method 1: Manual TODO**
1. Go to your calendar
2. Click on today's date
3. In the event modal, look for TODO options
4. Create an event with title starting with "TO DO:" (e.g., "TO DO: Water plants")

**Method 2: Recurring Actions**
1. Click on a date
2. Add a recurring action (these automatically create TODOs)

### Step 5: Check Debug Information

1. Open email settings (📧 button)
2. Scroll down to "🔧 Troubleshooting"
3. Click "Show Debug Info"
4. Click "Refresh Info"

**What to look for:**
- **🚨 Issues section**: Should show "No issues detected"
- **📋 TODO Details**: Should show your TODOs
- **⚙️ Service Status**: Should show "Notification Service: ✅ Running"
- **⏰ Timing Info**: Check if current time is past reminder time

### Step 6: Force Send Manual Reminder (Testing)

If automatic reminders aren't working, try manual sending:

1. In debug panel, click "📧 Manual Daily Reminder"
2. Check your email
3. If this works, automatic reminders should work too

**If manual reminder fails:**
- Check browser console for errors (F12 → Console tab)
- Look for red error messages
- Common errors:
  - "EmailJS not configured" → Check Step 1
  - "No TODOs to remind about" → Check Step 4
  - "Failed to send email" → Check EmailJS account status

---

## Common Issues and Solutions

### ❌ Issue: "Email service not configured"
**Solution:** You're missing the `.env` file or environment variables.
1. Create `.env` in project root
2. Add the three `REACT_APP_EMAILJS_*` variables
3. Restart the app completely (`Ctrl+C` then `npm start`)

### ❌ Issue: Test email works but no automatic reminders
**Possible causes:**
1. **No TODOs**: Create TODOs with "TO DO:" prefix
2. **Wrong time**: Set reminder time to current time or earlier
3. **Already sent today**: Check "Last Daily Reminder" in debug panel
4. **Service not running**: Refresh the page to restart notification service

### ❌ Issue: Can't find 📧 email button
**Solution:** Look in the header:
- **Mobile**: Top right, next to Month/Day buttons
- **Desktop**: Top right, labeled "Email"

### ❌ Issue: Test email in spam folder
**Solution:** 
1. Mark as "Not Spam"
2. Add sender to contacts
3. Future emails should arrive in inbox

### ❌ Issue: EmailJS rate limit reached
EmailJS free tier: 200 emails/month
**Solution:** Upgrade your EmailJS plan or wait for next month

---

## Quick Reset Procedure

If nothing works, try this complete reset:

1. In email settings debug panel, click "🔄 Complete Reset"
2. Re-enter your email address
3. Enable notifications again
4. Set reminder time to current time (for testing)
5. Click "🧪 Clear Auto Timestamps"
6. Create a test TODO for today
7. Click "📧 Manual Daily Reminder"
8. Check your email

---

## How Automatic Reminders Work

The system checks every 60 seconds for reminders to send. A reminder is sent when:

1. ✅ Email notifications are enabled
2. ✅ EmailJS is configured
3. ✅ Current time ≥ reminder time
4. ✅ No automatic reminder sent yet today
5. ✅ There are TODOs due today or overdue

**Important Notes:**
- Reminders are sent once per day at your configured time
- If you miss the time, no reminder until next day
- Manual reminders can be sent anytime via debug panel
- System only checks while app is open in browser

---

## Still Not Working?

### Check Browser Console Logs
1. Open browser DevTools (F12 or right-click → Inspect)
2. Go to Console tab
3. Look for messages containing:
   - `🔍 Daily reminder check`
   - `📧 Notification Log`
   - `❌ EmailJS not configured`
   - Any red error messages

### Verify Environment Variables Loaded
In browser console, type:
```javascript
console.log('Service ID:', process.env.REACT_APP_EMAILJS_SERVICE_ID)
console.log('Template ID:', process.env.REACT_APP_EMAILJS_TEMPLATE_ID)
console.log('Public Key:', process.env.REACT_APP_EMAILJS_PUBLIC_KEY)
```

If these show `undefined`, your `.env` file isn't being read. Make sure:
- File is named exactly `.env` (not `.env.txt`)
- File is in project root (same folder as `package.json`)
- You restarted the app after creating the file

---

## Need More Help?

### Files to Check
- `/Users/ievak/happy-tomato/.env` - Environment variables
- Email settings in app (📧 button)
- Debug panel in email settings
- Browser console (F12)

### Documentation
- `EMAIL_SETUP_INSTRUCTIONS.md` - EmailJS setup guide
- `README_EMAIL_NOTIFICATIONS.md` - Feature documentation

### Support
If you've tried everything:
1. Check EmailJS dashboard for service status
2. Verify your EmailJS template is active
3. Try creating a new EmailJS template
4. Test with a different email address

