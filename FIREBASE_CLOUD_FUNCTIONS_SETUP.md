# 🚀 Firebase Cloud Functions Setup Guide

## Overview

This guide will help you set up Firebase Cloud Functions to send email notifications automatically, even when your browser is closed.

## Prerequisites

- Firebase project already set up ✅
- Firebase CLI installed
- Node.js installed

---

## Step 1: Upgrade to Firebase Blaze Plan

Firebase Cloud Functions require the Blaze (pay-as-you-go) plan.

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click "Upgrade" in the bottom left
4. Choose "Blaze Plan"
5. Add a payment method

**Don't worry about costs:**
- Free tier includes 2 million function invocations/month
- For daily emails, you'll use ~30-60 invocations/month
- You'll likely stay in the free tier
- You can set budget alerts to be safe

---

## Step 2: Install Firebase CLI

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Verify you're logged in
firebase projects:list
```

---

## Step 3: Initialize Firebase Functions

```bash
# Navigate to your project
cd /Users/ievak/happy-tomato

# Initialize Firebase Functions
firebase init functions
```

**Answer the prompts:**
- "Use an existing project" → Select your project
- "JavaScript or TypeScript?" → JavaScript
- "ESLint?" → Yes (recommended)
- "Install dependencies?" → Yes

This creates a `functions/` directory with:
```
functions/
├── index.js          # Your Cloud Functions code
├── package.json      # Dependencies
└── .eslintrc.js     # Linting config
```

---

## Step 4: Install Required Dependencies

```bash
cd functions
npm install @emailjs/nodejs firebase-admin dayjs
```

---

## Step 5: Set Up Environment Variables

```bash
# Set your EmailJS credentials
firebase functions:config:set \
  emailjs.service_id="service_ouy6o0t" \
  emailjs.template_id="template_m5dzrqq" \
  emailjs.public_key="8rECxEZP_3GMbx7LZ" \
  emailjs.private_key="9adGPSxr3-5NOgNvbwgPL"

# Get your private key from EmailJS:
# 1. Go to https://dashboard.emailjs.com/admin/account
# 2. Copy your Private Key
# 3. Replace YOUR_PRIVATE_KEY above
```

---

## Step 6: Create the Cloud Function

Replace the contents of `functions/index.js` with this code:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const emailjs = require('@emailjs/nodejs');
const dayjs = require('dayjs');

admin.initializeApp();

/**
 * Format TODO list for email
 */
function formatTodoList(todos) {
  if (!todos || todos.length === 0) {
    return 'No TODOs found.';
  }

  return todos.map(todo => {
    const dueDate = new Date(todo.day).toLocaleDateString();
    
    // Get action name
    let actionName = '';
    if (todo.actions && todo.actions.length > 0) {
      actionName = todo.actions.join(', ');
    } else if (todo.toDo) {
      const todoText = Array.isArray(todo.toDo) ? todo.toDo.join(', ') : todo.toDo;
      actionName = todoText.replace(/^TO DO:\s*/i, '');
    } else if (todo.title) {
      actionName = todo.title.replace(/^TO DO:\s*/i, '');
    }
    
    // Get plant labels
    const plantLabels = todo.labels && todo.labels.length > 0 
      ? todo.labels.join(', ')
      : '';
    
    // Determine status
    const today = new Date();
    const dueDate_obj = new Date(todo.day);
    today.setHours(0, 0, 0, 0);
    dueDate_obj.setHours(0, 0, 0, 0);
    
    let statusEmoji = '📝';
    let statusText = '';
    
    if (dueDate_obj < today) {
      statusEmoji = '⚠️';
      statusText = ' - OVERDUE';
    } else if (dueDate_obj.getTime() === today.getTime()) {
      statusEmoji = '📅';
      statusText = ' - Due Today';
    }
    
    // Build todo line
    let todoLine = `${statusEmoji} `;
    if (actionName) {
      todoLine += actionName;
      if (plantLabels) {
        todoLine += ` (${plantLabels})`;
      }
    } else {
      todoLine += 'Unnamed TODO';
      if (plantLabels) {
        todoLine += ` (${plantLabels})`;
      }
    }
    
    todoLine += ` - Due: ${dueDate}${statusText}`;
    return todoLine;
  }).join('\n');
}

/**
 * Get TODOs that are due today or overdue
 */
function getDueAndOverdueTodos(events) {
  const today = dayjs().startOf('day');
  
  return events.filter(evt => {
    // Check if it's a TODO
    const isTodoEvent = evt.isRecurringTodo || 
                       (typeof evt.title === 'string' && evt.title.startsWith("TO DO:")) ||
                       (typeof evt.toDo === 'string' && evt.toDo.startsWith("TO DO:"));
    
    if (!isTodoEvent || evt.completed) return false;
    
    const eventDate = dayjs(evt.day).startOf('day');
    
    // Include if due today or overdue
    return eventDate.isSameOrBefore(today, 'day');
  });
}

/**
 * Get TODOs due in X days (for advance reminders)
 */
function getTodosInAdvance(events, days) {
  const targetDate = dayjs().add(days, 'days').startOf('day');
  
  return events.filter(evt => {
    const isTodoEvent = evt.isRecurringTodo || 
                       (typeof evt.title === 'string' && evt.title.startsWith("TO DO:")) ||
                       (typeof evt.toDo === 'string' && evt.toDo.startsWith("TO DO:"));
    
    if (!isTodoEvent || evt.completed) return false;
    
    const eventDate = dayjs(evt.day).startOf('day');
    return eventDate.isSame(targetDate, 'day');
  });
}

/**
 * Send email using EmailJS
 */
async function sendEmail(userEmail, userName, todos, reminderType) {
  const config = functions.config().emailjs;
  
  const templateParams = {
    to_email: userEmail,
    to_name: userName || 'Garden Friend',
    reminder_type: reminderType,
    todo_count: todos.length,
    todo_list: formatTodoList(todos),
    today_date: new Date().toLocaleDateString(),
    app_name: 'Happy Tomato Garden Planner'
  };

  try {
    await emailjs.send(
      config.service_id,
      config.template_id,
      templateParams,
      {
        publicKey: config.public_key,
        privateKey: config.private_key,
      }
    );
    console.log(`✅ Email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${userEmail}:`, error);
    return false;
  }
}

/**
 * Cloud Function: Send Daily Reminders
 * Runs every hour and checks if it's time to send reminders
 */
exports.sendDailyReminders = functions.pubsub
  .schedule('0 * * * *') // Every hour at minute 0
  .timeZone('America/New_York') // Change to your timezone
  .onRun(async (context) => {
    console.log('🔍 Checking for daily reminders to send...');
    
    const now = dayjs();
    const currentHour = now.hour();
    const currentMinute = now.minute();
    
    try {
      // Get all email preferences
      const prefsSnapshot = await admin.firestore()
        .collection('emailPreferences')
        .where('enabled', '==', true)
        .where('dailyReminder', '==', true)
        .get();
      
      if (prefsSnapshot.empty) {
        console.log('No users with daily reminders enabled');
        return null;
      }
      
      // Get all events
      const eventsSnapshot = await admin.firestore()
        .collection('events')
        .get();
      
      const events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`Found ${events.length} events`);
      
      // Process each user
      for (const prefDoc of prefsSnapshot.docs) {
        const prefs = prefDoc.data();
        const userId = prefDoc.id;
        
        // Parse reminder time
        const [reminderHour, reminderMinute] = prefs.reminderTime.split(':').map(Number);
        
        // Check if it's time to send (within the current hour)
        if (currentHour !== reminderHour) {
          console.log(`Not time yet for ${prefs.userEmail} (wants ${reminderHour}:${reminderMinute}, now is ${currentHour}:${currentMinute})`);
          continue;
        }
        
        // Check if we already sent today
        const lastSent = prefs.lastAutoReminderSent ? dayjs(prefs.lastAutoReminderSent) : null;
        if (lastSent && lastSent.isSame(now, 'day')) {
          console.log(`Already sent daily reminder to ${prefs.userEmail} today`);
          continue;
        }
        
        // Get due/overdue TODOs
        const dueTodos = getDueAndOverdueTodos(events);
        
        if (dueTodos.length === 0) {
          console.log(`No due TODOs for ${prefs.userEmail}`);
          continue;
        }
        
        console.log(`📧 Sending daily reminder to ${prefs.userEmail} (${dueTodos.length} TODOs)`);
        
        // Send email
        const success = await sendEmail(
          prefs.userEmail,
          prefs.userName,
          dueTodos,
          'Daily Garden Reminder'
        );
        
        if (success) {
          // Update last sent timestamp
          await admin.firestore()
            .collection('emailPreferences')
            .doc(userId)
            .update({
              lastAutoReminderSent: admin.firestore.FieldValue.serverTimestamp()
            });
        }
      }
      
      console.log('✅ Daily reminder check complete');
      return null;
    } catch (error) {
      console.error('❌ Error in sendDailyReminders:', error);
      return null;
    }
  });

/**
 * Cloud Function: Send Advance Reminders
 * Runs every hour and checks if it's time to send advance reminders
 */
exports.sendAdvanceReminders = functions.pubsub
  .schedule('0 * * * *') // Every hour at minute 0
  .timeZone('America/New_York') // Change to your timezone
  .onRun(async (context) => {
    console.log('🔍 Checking for advance reminders to send...');
    
    const now = dayjs();
    const currentHour = now.hour();
    const currentMinute = now.minute();
    
    try {
      // Get all email preferences with advance reminders enabled
      const prefsSnapshot = await admin.firestore()
        .collection('emailPreferences')
        .where('enabled', '==', true)
        .where('advanceReminders', '==', true)
        .get();
      
      if (prefsSnapshot.empty) {
        console.log('No users with advance reminders enabled');
        return null;
      }
      
      // Get all events
      const eventsSnapshot = await admin.firestore()
        .collection('events')
        .get();
      
      const events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Process each user
      for (const prefDoc of prefsSnapshot.docs) {
        const prefs = prefDoc.data();
        const userId = prefDoc.id;
        
        // Parse reminder time
        const [reminderHour, reminderMinute] = prefs.reminderTime.split(':').map(Number);
        
        // Check if it's time to send (within the current hour)
        if (currentHour !== reminderHour) {
          continue;
        }
        
        // Check if we already sent today
        const lastSent = prefs.lastAutoAdvanceReminderSent ? dayjs(prefs.lastAutoAdvanceReminderSent) : null;
        if (lastSent && lastSent.isSame(now, 'day')) {
          console.log(`Already sent advance reminder to ${prefs.userEmail} today`);
          continue;
        }
        
        // Get advance TODOs
        const advanceDays = prefs.advanceDays || 3;
        const advanceTodos = getTodosInAdvance(events, advanceDays);
        
        if (advanceTodos.length === 0) {
          console.log(`No advance TODOs for ${prefs.userEmail}`);
          continue;
        }
        
        console.log(`📧 Sending ${advanceDays}-day advance reminder to ${prefs.userEmail} (${advanceTodos.length} TODOs)`);
        
        // Send email
        const success = await sendEmail(
          prefs.userEmail,
          prefs.userName,
          advanceTodos,
          `${advanceDays}-Day Advance Garden Reminder`
        );
        
        if (success) {
          // Update last sent timestamp
          await admin.firestore()
            .collection('emailPreferences')
            .doc(userId)
            .update({
              lastAutoAdvanceReminderSent: admin.firestore.FieldValue.serverTimestamp()
            });
        }
      }
      
      console.log('✅ Advance reminder check complete');
      return null;
    } catch (error) {
      console.error('❌ Error in sendAdvanceReminders:', error);
      return null;
    }
  });
```

---

## Step 7: Update Your React App to Store Preferences in Firestore

Currently, email preferences are stored in localStorage. We need to also store them in Firestore so the Cloud Function can access them.

Update `src/hooks/useEmailNotifications.js`:

```javascript
// Add this import at the top
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Add this function inside useEmailNotifications hook
const syncPreferencesToFirestore = async (preferences) => {
  try {
    // Use email as document ID (or user ID if you have authentication)
    const docId = preferences.userEmail.replace(/[.#$[\]]/g, '_'); // Sanitize email for Firestore
    
    await setDoc(doc(db, 'emailPreferences', docId), {
      ...preferences,
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Email preferences synced to Firestore');
  } catch (error) {
    console.error('❌ Failed to sync preferences to Firestore:', error);
  }
};

// Update the updateEmailPreferences function
const updateEmailPreferences = (newPreferences) => {
  setEmailPreferences(prev => {
    const updated = { ...prev, ...newPreferences };
    
    // ... existing logic ...
    
    // Sync to Firestore
    if (updated.userEmail) {
      syncPreferencesToFirestore(updated);
    }
    
    return updated;
  });
};
```

---

## Step 8: Deploy the Cloud Functions

```bash
# Make sure you're in the project root
cd /Users/ievak/happy-tomato

# Deploy
firebase deploy --only functions
```

This will:
1. Upload your functions to Firebase
2. Set up the scheduled triggers
3. Show you the function URLs

---

## Step 9: Monitor Your Functions

### View Logs
```bash
firebase functions:log
```

### View in Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to "Functions" in the left sidebar
4. You'll see your deployed functions and their execution logs

---

## Step 10: Test the Setup

### Test Immediately (Manual Trigger)

You can test the function manually:

```bash
# This will trigger the function immediately
firebase functions:shell

# In the shell, run:
sendDailyReminders()
```

### Test with Real Schedule

1. Set your reminder time to the next hour
2. Save preferences in the app (this syncs to Firestore)
3. Wait for the next hour
4. Check Firebase logs to see if the function ran

---

## Troubleshooting

### Function Not Running

Check the logs:
```bash
firebase functions:log --only sendDailyReminders
```

### EmailJS Private Key

If you don't have your EmailJS private key:
1. Go to https://dashboard.emailjs.com/admin/account
2. Copy your Private Key
3. Update the config:
   ```bash
   firebase functions:config:set emailjs.private_key="YOUR_PRIVATE_KEY"
   firebase deploy --only functions
   ```

### Timezone Issues

Change the timezone in the function:
```javascript
.timeZone('America/Los_Angeles') // Or your timezone
```

Find your timezone: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

### No Emails Sent

1. Check if preferences exist in Firestore:
   - Go to Firebase Console → Firestore Database
   - Look for `emailPreferences` collection
   - Verify your email is there with `enabled: true`

2. Check if events exist:
   - Look for `events` collection
   - Verify you have TODOs

3. Check function logs for errors

---

## Cost Monitoring

Set up budget alerts:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to "Billing" → "Budgets & alerts"
4. Create a budget alert for $5/month (way more than you'll use)

---

## Summary

After setup, your system will:
- ✅ Run automatically every hour
- ✅ Check if it's time to send reminders for each user
- ✅ Send emails at the configured time
- ✅ Work even when browser is closed
- ✅ Be reliable and professional

The page no longer needs to be open! 🎉

