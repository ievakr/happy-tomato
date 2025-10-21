# SendGrid Quick Start - Action Items

## ✅ Completed
- [x] Installed SendGrid package
- [x] Updated Cloud Functions code
- [x] Removed EmailJS dependency

## 🎯 What You Need To Do Now

### 1. Create SendGrid Account (5 minutes)
👉 https://signup.sendgrid.com/

### 2. Verify Your Email Address (2 minutes)
1. Login to SendGrid: https://app.sendgrid.com/
2. Go to: **Settings** → **Sender Authentication** → **Verify a Single Sender**
3. Use: `ieva.krisciunaite94@gmail.com` (or your preferred email)
4. Click the verification link in your email

### 3. Create API Key (2 minutes)
1. Go to: **Settings** → **API Keys** → **Create API Key**
2. Name: `happy-tomato-firebase`
3. Permission: **Restricted Access** → **Mail Send: Full Access**
4. **COPY THE KEY** (you'll only see it once!)

### 4. Configure Firebase (30 seconds)

```bash
# Replace YOUR_API_KEY with the key from step 3
firebase functions:config:set sendgrid.api_key="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"

# Replace with your verified email from step 2
firebase functions:config:set sendgrid.from_email="ieva.krisciunaite94@gmail.com"
```

### 5. Deploy (2 minutes)

```bash
firebase deploy --only functions
```

### 6. Test (1 minute)

1. Open: https://happytomato-c4fed.web.app
2. Go to Settings → Email Notifications
3. Click "Send Test Email"
4. Check your inbox! 📧

---

## 📋 Copy-Paste Commands

Once you have your SendGrid API key, run these:

```bash
# Navigate to project
cd /Users/ievak/happy-tomato

# Set SendGrid credentials (REPLACE THE VALUES!)
firebase functions:config:set sendgrid.api_key="SG.YOUR_KEY_HERE"
firebase functions:config:set sendgrid.from_email="ieva.krisciunaite94@gmail.com"

# Verify configuration
firebase functions:config:get

# Deploy
firebase deploy --only functions

# Watch logs (optional)
firebase functions:log --only sendDailyReminders,sendAdvanceReminders
```

---

## 🎉 Benefits of SendGrid vs EmailJS

✅ **Works from Cloud Functions** (EmailJS doesn't)  
✅ **Free 100 emails/day** (more than enough)  
✅ **Better email deliverability**  
✅ **Activity tracking dashboard**  
✅ **Professional HTML emails**  

---

**Total Time**: ~10 minutes  
**Full Instructions**: See `SENDGRID_SETUP.md`

