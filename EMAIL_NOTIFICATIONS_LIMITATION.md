# 🚨 Email Notifications Limitation - Page Must Be Open

## The Problem

You've discovered a **fundamental limitation** of the current email notification system:

**Emails are only sent when the browser page is open.**

## Why This Happens

The current implementation uses **client-side JavaScript** to send emails:

1. **NotificationService runs in the browser** (`src/services/notificationService.js`)
   - Uses `setInterval` to check every 60 seconds
   - Calls EmailJS API directly from the browser
   - When you close the page → JavaScript stops → No checks → No emails

2. **EmailJS is a client-side service**
   - Designed for sending emails from web browsers
   - Cannot run without an active browser session
   - No server-side scheduling capabilities

3. **React app lifecycle**
   - React apps only run when the page is loaded
   - No background processes
   - No persistent timers

## Current Architecture

```
Browser (Open) → React App → NotificationService → EmailJS → Email Sent ✅
Browser (Closed) → No React App → No Service → No Email ❌
```

## Solutions

You have **three options** to fix this:

---

### Option 1: Keep Page Open (Simplest, But Not Ideal)

**What to do:**
- Keep a browser tab open with your app running
- The page will continue checking and sending emails
- Works on desktop computers that stay on

**Pros:**
- No code changes needed
- Works immediately
- Free

**Cons:**
- Not reliable (browser might close, computer might sleep)
- Wastes computer resources
- Not a professional solution

---

### Option 2: Add Server-Side Backend (Best Solution)

Create a backend server that runs 24/7 and sends emails on schedule.

#### Option 2A: Firebase Cloud Functions (Recommended)

Since you're already using Firebase, this is the natural choice.

**What you need:**
1. Upgrade to Firebase Blaze plan (pay-as-you-go, but likely free for your usage)
2. Create a Cloud Function that runs on a schedule
3. Move email sending logic to the server

**Implementation:**

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const emailjs = require('@emailjs/nodejs'); // Server-side version

admin.initializeApp();

// Runs every day at 9:00 AM
exports.sendDailyReminders = functions.pubsub
  .schedule('0 9 * * *') // Cron format
  .timeZone('America/New_York') // Your timezone
  .onRun(async (context) => {
    console.log('Running daily reminder check...');
    
    // Get all users' email preferences from Firestore
    const prefsSnapshot = await admin.firestore()
      .collection('emailPreferences')
      .where('enabled', '==', true)
      .get();
    
    // Get all events
    const eventsSnapshot = await admin.firestore()
      .collection('events')
      .get();
    
    const events = eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // For each user with notifications enabled
    for (const prefDoc of prefsSnapshot.docs) {
      const prefs = prefDoc.data();
      
      // Find due/overdue TODOs
      const dueTodos = events.filter(evt => {
        // Your TODO filtering logic here
        return evt.isRecurringTodo && !evt.completed;
      });
      
      if (dueTodos.length > 0) {
        // Send email using EmailJS server-side
        await emailjs.send(
          process.env.EMAILJS_SERVICE_ID,
          process.env.EMAILJS_TEMPLATE_ID,
          {
            to_email: prefs.userEmail,
            to_name: prefs.userName,
            todo_list: formatTodos(dueTodos),
            // ... other template params
          },
          {
            publicKey: process.env.EMAILJS_PUBLIC_KEY,
            privateKey: process.env.EMAILJS_PRIVATE_KEY,
          }
        );
        
        console.log(`Sent reminder to ${prefs.userEmail}`);
      }
    }
    
    return null;
  });
```

**Setup Steps:**

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. Initialize Firebase Functions:
   ```bash
   cd /Users/ievak/happy-tomato
   firebase init functions
   ```

3. Install dependencies:
   ```bash
   cd functions
   npm install @emailjs/nodejs firebase-admin
   ```

4. Deploy:
   ```bash
   firebase deploy --only functions
   ```

**Costs:**
- Free tier: 2 million invocations/month
- For daily emails, you'll use ~30 invocations/month
- Essentially **FREE** for your use case

**Pros:**
- ✅ Runs 24/7 automatically
- ✅ No page needs to be open
- ✅ Reliable and professional
- ✅ Integrates with existing Firebase setup
- ✅ Likely free with Firebase free tier

**Cons:**
- Requires Firebase Blaze plan (credit card)
- Need to move email preferences to Firestore
- Some setup work required

---

#### Option 2B: Use a Separate Backend Service

Use a service like:
- **Vercel Cron Jobs** (free tier available)
- **Netlify Functions** (free tier available)
- **Railway** (free tier available)
- **Render** (free tier available)

Similar to Firebase Functions, but hosted elsewhere.

---

### Option 3: Use a Dedicated Email Scheduling Service

Replace EmailJS with a service that has built-in scheduling:

#### Services with Scheduling:
- **SendGrid** (free tier: 100 emails/day)
- **Mailgun** (free tier: 5,000 emails/month)
- **Amazon SES** (very cheap, ~$0.10 per 1000 emails)
- **Resend** (free tier: 3,000 emails/month)

**How it works:**
1. User configures reminder time in your app
2. Your app makes an API call to the service to schedule the email
3. The service sends the email at the scheduled time
4. No page needs to be open

**Example with SendGrid:**

```javascript
// When user saves settings
async function scheduleReminder(userEmail, reminderTime, todos) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: userEmail }],
        send_at: calculateUnixTimestamp(reminderTime) // Unix timestamp
      }],
      from: { email: 'noreply@yourdomain.com' },
      subject: 'Your Daily Garden Reminders',
      content: [{
        type: 'text/html',
        value: formatEmailHTML(todos)
      }]
    })
  });
}
```

**Pros:**
- ✅ No backend server needed
- ✅ Reliable delivery
- ✅ Professional email service
- ✅ Better deliverability than EmailJS

**Cons:**
- Need to switch from EmailJS
- Requires API key setup
- May need a custom domain for best deliverability

---

## Recommendation

**For your use case, I recommend Option 2A: Firebase Cloud Functions**

Why?
1. You're already using Firebase
2. It's free for your usage level
3. Most reliable solution
4. Professional and scalable
5. Keeps all your data in one place

---

## Quick Comparison

| Solution | Reliability | Cost | Setup Difficulty | Page Must Be Open? |
|----------|-------------|------|------------------|-------------------|
| Current (Keep page open) | ⭐ Low | Free | None | ✅ YES |
| Firebase Functions | ⭐⭐⭐⭐⭐ Excellent | Free* | Medium | ❌ NO |
| Other Backend | ⭐⭐⭐⭐⭐ Excellent | Free-Paid | Medium | ❌ NO |
| Email Scheduling Service | ⭐⭐⭐⭐ Good | Free-Paid | Medium | ❌ NO |

*Free for typical usage, requires Blaze plan

---

## What Happens Now?

**Short-term workaround:**
Keep a browser tab open with your app running. This will work but isn't ideal.

**Long-term fix:**
Implement one of the server-side solutions above. I can help you set up Firebase Cloud Functions if you'd like.

---

## Need Help Implementing?

I can help you:
1. Set up Firebase Cloud Functions
2. Migrate email preferences to Firestore
3. Create the scheduled function
4. Test and deploy

Just let me know which solution you'd like to pursue!

