# SendGrid Setup Guide

## Step 1: Create SendGrid Account

1. Go to https://signup.sendgrid.com/
2. Sign up for a **FREE** account (up to 100 emails/day forever)
3. Verify your email address

## Step 2: Verify Sender Identity

SendGrid requires you to verify your email address before sending emails.

1. Log into SendGrid dashboard: https://app.sendgrid.com/
2. Go to **Settings** > **Sender Authentication**
3. Click **Verify a Single Sender**
4. Fill in the form:
   - **From Name**: Happy Tomato Garden Planner
   - **From Email Address**: Your email (e.g., `ieva.krisciunaite94@gmail.com`)
   - **Reply To**: Same as your email
   - **Company Address**: You can use your home address
   - **City**, **State**, **Zip**: Your location
   - **Country**: Lithuania
5. Click **Create**
6. Check your email and click the verification link

⚠️ **Important**: You MUST use this verified email as the "from" address when configuring Firebase.

## Step 3: Create API Key

1. In SendGrid dashboard, go to **Settings** > **API Keys**
2. Click **Create API Key**
3. Choose **Restricted Access** (recommended for security)
4. Name it: `happy-tomato-firebase-functions`
5. Under **Mail Send**, toggle it to **Full Access**
6. Click **Create & View**
7. **COPY THE API KEY** - you'll only see it once!
   - It looks like: `SG.xxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy`

## Step 4: Configure Firebase with SendGrid Credentials

Run these commands in your terminal (replace with your actual values):

```bash
# Set SendGrid API Key
firebase functions:config:set sendgrid.api_key="YOUR_SENDGRID_API_KEY_HERE"

# Set the verified sender email (the one you verified in Step 2)
firebase functions:config:set sendgrid.from_email="ieva.krisciunaite94@gmail.com"
```

**Example:**
```bash
firebase functions:config:set sendgrid.api_key="SG.abc123xyz789.longstring"
firebase functions:config:set sendgrid.from_email="ieva.krisciunaite94@gmail.com"
```

## Step 5: Verify Configuration

```bash
firebase functions:config:get
```

You should see:
```json
{
  "sendgrid": {
    "api_key": "SG.xxx...",
    "from_email": "ieva.krisciunaite94@gmail.com"
  }
}
```

## Step 6: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

## Step 7: Test Email Notifications

1. Open your app: https://happytomato-c4fed.web.app
2. Go to **Settings** (⚙️ icon)
3. Scroll to **Email Notifications**
4. Enable notifications and set your preferences
5. Click **Send Test Email**
6. Check your inbox (and spam folder)!

## Troubleshooting

### Email Not Arriving?

1. **Check SendGrid Activity Dashboard**:
   - Go to https://app.sendgrid.com/
   - Click **Activity** in the left menu
   - Look for your email - status should be "Delivered"

2. **Check Spam Folder**: First emails from new senders often land in spam

3. **Verify Sender Identity**: Make sure you completed Step 2 and clicked the verification link

4. **Check Firebase Logs**:
   ```bash
   firebase functions:log --only sendDailyReminders,sendAdvanceReminders
   ```

### Common Errors

**Error: "The from email does not contain a valid address"**
- Solution: Make sure you verified the sender email in SendGrid (Step 2)
- Make sure the `from_email` config matches exactly

**Error: "Permission denied"**
- Solution: Your API key doesn't have Mail Send permissions
- Create a new API key with Full Access to Mail Send

## Free Tier Limits

SendGrid free tier includes:
- ✅ **100 emails per day** (forever free)
- ✅ Unlimited contacts
- ✅ Email API access
- ✅ Activity tracking for 30 days

This is perfect for a personal garden planner! 🌱

## What's Next?

Once configured, your Cloud Functions will automatically:
- Send daily reminders at your chosen time (e.g., 11:00 AM)
- Send advance reminders (e.g., 3 days before TODOs are due)
- Track when reminders were sent to avoid duplicates
- Format emails beautifully with HTML

The emails will have:
- 🌱 Garden-themed styling
- ✅ Clear TODO lists with due dates
- ⚠️ Overdue indicators
- 🔗 Direct link back to your app

---

**Need Help?** Check the Firebase logs or SendGrid Activity dashboard for detailed error messages.

