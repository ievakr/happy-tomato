# ✅ Cloud Functions Setup Progress

## What's Been Done

✅ **Firebase CLI installed** (version 14.20.0)
✅ **Functions directory created** (`/functions`)
✅ **Dependencies installed** (firebase-admin, firebase-functions, @emailjs/nodejs, dayjs)
✅ **Cloud Functions code written** (`functions/index.js`)
✅ **Configuration files created** (package.json, .eslintrc.js, .gitignore)

---

## Next Steps

### Step 1: Login to Firebase

```bash
firebase login
```

This will open your browser to authenticate with Google.

### Step 2: Check Your Firebase Project

```bash
firebase projects:list
```

Make sure your project is listed. If you need to select it:

```bash
firebase use <your-project-id>
```

### Step 3: Upgrade to Blaze Plan

⚠️ **Required for Cloud Functions**

1. Go to https://console.firebase.google.com/
2. Select your project
3. Click "Upgrade" in the bottom left
4. Choose "Blaze Plan" (pay-as-you-go)
5. Add payment method

**Don't worry about cost:**
- Free tier: 2 million invocations/month
- Your usage: ~1,440 invocations/month (0.07% of free tier)
- You'll stay in the free tier

### Step 4: Get Your EmailJS Private Key

You need your EmailJS **Private Key** (different from Public Key):

1. Go to https://dashboard.emailjs.com/admin/account
2. Scroll to "Private Key" section
3. Copy your private key

### Step 5: Set Environment Variables

Replace `YOUR_PRIVATE_KEY_HERE` with the key you copied:

```bash
firebase functions:config:set \
  emailjs.service_id="service_ouy6o0t" \
  emailjs.template_id="template_m5dzrqq" \
  emailjs.public_key="8rECxEZP_3GMbx7LZ" \
  emailjs.private_key="YOUR_PRIVATE_KEY_HERE"
```

### Step 6: Update Your React App

You need to sync email preferences to Firestore so Cloud Functions can access them.

#### Edit `src/hooks/useEmailNotifications.js`

Add these imports at the top:

```javascript
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
```

Add this function inside the `useEmailNotifications` hook (after the state declarations):

```javascript
/**
 * Sync preferences to Firestore for Cloud Functions
 */
const syncToFirestore = async (prefs) => {
  try {
    // Sanitize email for use as document ID
    const docId = prefs.userEmail.replace(/[.#$[\]]/g, '_');
    
    await setDoc(doc(db, 'emailPreferences', docId), {
      enabled: prefs.enabled,
      userEmail: prefs.userEmail,
      userName: prefs.userName,
      dailyReminder: prefs.dailyReminder,
      reminderTime: prefs.reminderTime,
      overdueReminders: prefs.overdueReminders,
      dueTodayReminders: prefs.dueTodayReminders,
      advanceReminders: prefs.advanceReminders,
      advanceDays: prefs.advanceDays,
      lastAutoReminderSent: prefs.lastAutoReminderSent,
      lastAutoAdvanceReminderSent: prefs.lastAutoAdvanceReminderSent,
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Email preferences synced to Firestore');
  } catch (error) {
    console.error('❌ Failed to sync preferences to Firestore:', error);
  }
};
```

Then update the `updateEmailPreferences` function to sync to Firestore:

```javascript
const updateEmailPreferences = (newPreferences) => {
  setEmailPreferences(prev => {
    const updated = { ...prev, ...newPreferences };
    
    // ... existing logic for clearing timestamps ...
    
    // Sync to Firestore if email is configured
    if (updated.userEmail) {
      syncToFirestore(updated);
    }
    
    return updated;
  });
};
```

### Step 7: Update Firestore Rules (Optional but Recommended)

Add rules to allow Cloud Functions to read/write email preferences:

Go to Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Existing rules for events
    match /events/{document=**} {
      allow read, write: if true;
    }
    
    // New rules for email preferences
    match /emailPreferences/{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Step 8: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

This will:
- Upload your functions to Firebase
- Set up scheduled triggers (runs every hour)
- Show you the deployed function URLs

**Note:** If you hit npm registry issues during deploy, the functions are already set up correctly. The deploy should work since we already installed dependencies.

### Step 9: Test Your Setup

#### Test 1: Check if preferences sync to Firestore

1. Open your app
2. Go to email settings (📧 button)
3. Update any setting and save
4. Go to Firebase Console → Firestore Database
5. You should see a new `emailPreferences` collection with your email

#### Test 2: View Cloud Function logs

```bash
firebase functions:log
```

Or in Firebase Console → Functions → Logs

#### Test 3: Wait for scheduled run

The functions run every hour at minute 0 (e.g., 1:00, 2:00, 3:00).

Set your reminder time to the next hour and wait to see if you get an email.

---

## Troubleshooting

### Issue: "Firebase project not found"

```bash
firebase projects:list
firebase use <your-project-id>
```

### Issue: "Billing account not configured"

You need to upgrade to Blaze plan (see Step 3).

### Issue: "EmailJS private key not working"

Make sure you're using the **Private Key**, not the Public Key.
Check: https://dashboard.emailjs.com/admin/account

### Issue: npm registry errors during deploy

If you see Wix registry errors during `firebase deploy`, try:

```bash
firebase deploy --only functions --registry https://registry.npmjs.org/
```

Or temporarily comment out the registry line in `~/.npmrc`:

```bash
# Edit ~/.npmrc and comment out:
# registry=http://npm.dev.wixpress.com/
```

### Issue: Functions not running

Check the logs:

```bash
firebase functions:log --only sendDailyReminders
```

Look for errors or confirmation that the function is running.

---

## What Happens After Deployment

1. **Every hour at minute 0**, both Cloud Functions run:
   - `sendDailyReminders` - checks for daily reminders
   - `sendAdvanceReminders` - checks for advance reminders

2. **Each function:**
   - Reads email preferences from Firestore
   - Checks if it's the right time to send
   - Gets TODOs from Firestore
   - Sends emails if needed
   - Updates timestamps

3. **You get emails automatically** even when:
   - Browser is closed ✅
   - Computer is off ✅
   - You're away ✅

---

## Cost Monitoring

Set up budget alerts (optional but recommended):

1. Go to https://console.cloud.google.com/
2. Select your Firebase project
3. Go to "Billing" → "Budgets & alerts"
4. Create alert for $5/month (way more than you'll use)

---

## Summary

**Current Status:**
- ✅ Functions code ready
- ✅ Dependencies installed
- ⏳ Need to: Login, upgrade plan, set config, deploy

**Time Remaining:** ~15-20 minutes

**Next Command:**
```bash
firebase login
```

Then follow steps 2-8 above! 🚀

