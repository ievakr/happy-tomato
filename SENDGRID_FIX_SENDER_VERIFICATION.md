# SendGrid Sender Verification Fix

## The Problem
SendGrid is rejecting emails because the "from" email address (`ieva.krisciunaite94@gmail.com`) is not verified in SendGrid.

Error message:
```
The from address does not match a verified Sender Identity. Mail cannot be sent until this error is resolved.
```

## Current Configuration
Your Firebase Functions config has:
- **From Email**: `ieva.krisciunaite94@gmail.com`
- **SendGrid API Key**: Set ✅

## Solution

### Step 1: Verify Your Email in SendGrid

1. **Go to SendGrid Dashboard**: https://app.sendgrid.com/
2. Navigate to: **Settings** → **Sender Authentication**
3. Choose **Single Sender Verification** (quickest option)
4. Click **"Create New Sender"** or **"Verify a Single Sender"**
5. Fill in the form:
   ```
   From Name: Happy Tomato Garden Planner
   From Email Address: ieva.krisciunaite94@gmail.com
   Reply To: ieva.krisciunaite94@gmail.com
   Company Address: (any address)
   Nickname: Happy Tomato
   ```
6. Click **Create**
7. **Check your email inbox** (`ieva.krisciunaite94@gmail.com`) for the verification link
8. **Click the verification link** to complete verification

### Step 2: Verify It Worked

After verifying, go back to SendGrid dashboard:
- Settings → Sender Authentication → Single Sender Verification
- You should see `ieva.krisciunaite94@gmail.com` with a **green checkmark** ✅

### Step 3: Test the Function

After verification is complete, wait a few minutes and the Cloud Functions should start working automatically.

You can manually test by running:
```bash
cd /Users/ievak/happy-tomato
firebase functions:log --only sendAdvanceReminders
```

## Alternative: Use a Different Email

If you want to use a different email address that's already verified:

1. Find your verified sender in SendGrid: Settings → Sender Authentication
2. Update Firebase config with the verified email:
   ```bash
   firebase functions:config:set sendgrid.from_email="your-verified-email@example.com"
   ```
3. Redeploy functions:
   ```bash
   firebase deploy --only functions
   ```

## Verification Checklist

- [ ] Went to SendGrid dashboard
- [ ] Created/verified single sender with `ieva.krisciunaite94@gmail.com`
- [ ] Checked email and clicked verification link
- [ ] Verified that email shows as verified in SendGrid dashboard
- [ ] Waited 5-10 minutes for changes to propagate
- [ ] Checked Firebase Functions logs to confirm emails are sending

## Important Notes

- ⚠️ **The email address must be exactly the same** in both SendGrid and Firebase config
- ⚠️ Verification usually takes 1-2 minutes after clicking the email link
- ⚠️ You may need to wait up to 10 minutes for SendGrid to propagate the changes
- ⚠️ Using `@gmail.com` is fine for testing but consider domain authentication for production

## Next Steps After Verification

Once verified, your Cloud Functions will automatically:
1. Send daily reminders at the configured time
2. Send advance reminders (3 days before) at the configured time
3. Both functions run every hour and check if it's the right time

## Troubleshooting

### Still Getting Errors After Verification?

1. **Double-check the email is verified**:
   - Go to SendGrid → Settings → Sender Authentication
   - Look for your email with a green checkmark

2. **Check for typos**:
   ```bash
   firebase functions:config:get sendgrid.from_email
   ```
   Should output: `"ieva.krisciunaite94@gmail.com"`

3. **Redeploy functions** (if you change config):
   ```bash
   firebase deploy --only functions
   ```

4. **View real-time logs**:
   ```bash
   firebase functions:log --follow
   ```

## Success Indicators

✅ No more "does not match a verified Sender Identity" errors
✅ Logs show: "✅ Email sent to [email]"
✅ Recipient receives the email with garden reminders

## Documentation

- SendGrid Single Sender Verification: https://docs.sendgrid.com/ui/sending-email/sender-verification
- Firebase Functions Config: https://firebase.google.com/docs/functions/config-env

