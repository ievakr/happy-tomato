# ⚡ Quick Start: Fix Email Notifications

## The Problem
Emails only send when the browser page is open.

## The Cause
React apps only run in the browser. When you close the tab, the code stops running.

## The Solution
Set up Firebase Cloud Functions to run on a server 24/7.

---

## 🚀 Quick Setup (30 minutes)

### 1. Upgrade Firebase Plan
```bash
# Go to: https://console.firebase.google.com/
# Click: Upgrade → Blaze Plan
# Add credit card (won't be charged for your usage)
```

### 2. Install & Initialize
```bash
cd /Users/ievak/happy-tomato

# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize functions
firebase init functions
# Choose: JavaScript, ESLint, Install dependencies
```

### 3. Install Dependencies
```bash
cd functions
npm install @emailjs/nodejs firebase-admin dayjs
cd ..
```

### 4. Get EmailJS Private Key
```bash
# Go to: https://dashboard.emailjs.com/admin/account
# Copy your Private Key
```

### 5. Set Environment Variables
```bash
firebase functions:config:set \
  emailjs.service_id="service_ouy6o0t" \
  emailjs.template_id="template_m5dzrqq" \
  emailjs.public_key="8rECxEZP_3GMbx7LZ" \
  emailjs.private_key="YOUR_PRIVATE_KEY_HERE"
```

### 6. Copy Function Code
```bash
# Open: functions/index.js
# Replace contents with code from FIREBASE_CLOUD_FUNCTIONS_SETUP.md
# (Search for "Step 6" in that file)
```

### 7. Update React App
Add this to `src/hooks/useEmailNotifications.js`:

```javascript
// At top of file
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

// Add this function inside the hook
const syncToFirestore = async (prefs) => {
  try {
    const docId = prefs.userEmail.replace(/[.#$[\]]/g, '_');
    await setDoc(doc(db, 'emailPreferences', docId), {
      ...prefs,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to sync:', error);
  }
};

// In updateEmailPreferences, add:
if (updated.userEmail) {
  syncToFirestore(updated);
}
```

### 8. Deploy
```bash
firebase deploy --only functions
```

### 9. Test
```bash
# View logs
firebase functions:log

# Or check Firebase Console
# https://console.firebase.google.com/ → Functions
```

---

## ✅ Done!

Your emails will now send automatically every hour, even when the browser is closed.

---

## 🆘 Need Help?

**Problem:** Can't find EmailJS Private Key
**Solution:** https://dashboard.emailjs.com/admin/account

**Problem:** Function not deploying
**Solution:** Check you're on Blaze plan and have billing enabled

**Problem:** No emails being sent
**Solution:** Check Firebase Console → Functions → Logs for errors

**Problem:** Want more details
**Solution:** Read `FIREBASE_CLOUD_FUNCTIONS_SETUP.md`

---

## 💰 Cost

**Free Tier:** 2 million invocations/month
**Your Usage:** ~60 invocations/month
**Cost:** $0 (stays in free tier)

---

## 🎯 Alternative: Keep Page Open

Don't want to set up Cloud Functions?

**Simple workaround:**
1. Keep a browser tab open with your app
2. Emails will continue to work
3. Not ideal, but works

---

## 📚 Full Documentation

- `EMAIL_ISSUE_EXPLAINED.md` - Detailed explanation
- `FIREBASE_CLOUD_FUNCTIONS_SETUP.md` - Complete setup guide
- `EMAIL_NOTIFICATIONS_LIMITATION.md` - All solution options

---

**Ready? Start with Step 1 above! 🚀**

