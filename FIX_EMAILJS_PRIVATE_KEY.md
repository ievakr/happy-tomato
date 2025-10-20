# 🔑 Action Required: Set EmailJS Private Key

## What Happened

Good news! The Cloud Functions found your advance todo and tried to send an email at 23:00 Vilnius time! 🎉

However, the email failed with this error:
```
API calls are disabled for non-browser applications
```

## Why This Happens

EmailJS requires a **private key** for server-side usage (Cloud Functions). The public key only works in browsers.

From the logs:
- ✅ **Timezone is working correctly**: 23:00 Vilnius time (which is 20:00 UTC) 
- ✅ **Found your advance todo**: "1-day advance reminder (1 TODOs)"
- ❌ **Email blocked**: Missing private key configuration

## How to Fix (2 Minutes)

### Step 1: Get Your EmailJS Private Key

1. Go to https://dashboard.emailjs.com/admin/account
2. Log in with your EmailJS account
3. Scroll down to the **"Private Key"** section
4. Click **"Generate Private Key"** (if you haven't already)
5. **Copy the private key** (it looks like a long random string)

### Step 2: Set the Private Key in Firebase

Run this command in your terminal (replace `YOUR_PRIVATE_KEY_HERE` with the key you just copied):

```bash
firebase functions:config:set \
  emailjs.service_id="service_ouy6o0t" \
  emailjs.template_id="template_m5dzrqq" \
  emailjs.public_key="8rECxEZP_3GMbx7LZ" \
  emailjs.private_key="YOUR_PRIVATE_KEY_HERE"
```

**Example** (with a fake private key):
```bash
firebase functions:config:set \
  emailjs.service_id="service_ouy6o0t" \
  emailjs.template_id="template_m5dzrqq" \
  emailjs.public_key="8rECxEZP_3GMbx7LZ" \
  emailjs.private_key="a8b7c6d5e4f3g2h1i0j9k8l7m6n5o4p3"
```

### Step 3: Redeploy the Functions

After setting the config, redeploy to apply the changes:

```bash
firebase deploy --only functions
```

### Step 4: Wait for Next Hour

Cloud Functions run **every hour at minute 0**. So:
- If it's currently 20:30, the next check will be at 21:00
- The function will check if it's your reminder time (21:00 in your case)
- If it matches, it will send the email! 📧

## What the Logs Show

From your Firebase logs (20:00 UTC = 23:00 Vilnius):

✅ **Working perfectly**:
```
⏰ Current time in Vilnius: 2025-10-20 23:00:03 (Hour: 23)
🔍 Looking for TODOs due on 2025-10-21 (1 days from now)
📧 Sending 1-day advance reminder to ieva.krisciunaite94@gmail.com (1 TODOs)
```

❌ **Only issue**:
```
❌ Failed to send email: API calls are disabled for non-browser applications
```

This will be fixed once you set the private key!

## After You Set the Private Key

The next time the function runs at your reminder time (21:00 Vilnius), you should see:
```
✅ Email sent to ieva.krisciunaite94@gmail.com
```

And you'll receive an email! 📬

## Troubleshooting

### Can't find the private key?
- Make sure you're logged into the correct EmailJS account
- The private key section is at the bottom of the Account page
- If you don't see it, you may need to upgrade your EmailJS plan

### Command not working?
Make sure you're in your project directory:
```bash
cd /Users/ievak/happy-tomato
firebase functions:config:set emailjs.private_key="YOUR_KEY_HERE"
```

### Want to verify the config was set?
```bash
firebase functions:config:get
```

This will show all your function configurations (keys will be hidden).

---

**Next Steps**: Set the private key and redeploy! Then your email notifications will work! 🎉

