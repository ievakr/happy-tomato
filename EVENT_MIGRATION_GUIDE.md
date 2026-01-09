# Event Migration Guide

## Overview

After adding Firebase Authentication, all new events are now automatically assigned to the user who creates them. However, existing events created before authentication don't have a `userId` field.

## The Problem

When you first log in after authentication was added, you might see **all previously created events**, even though they were created before user accounts existed. This happens because:

1. Old events don't have a `userId` field
2. The app now filters events by `userId`
3. Events without `userId` are visible to everyone (temporarily)

## The Solution

You have two options to handle existing events:

### Option 1: Claim Existing Events ✅ (Recommended)

Assign all unassigned events to your account. Use this if:
- You created these events yourself
- You want to keep the existing data
- You're the only user or primary user of the app

**How to do it:**
1. Log in to your account
2. Look for a **"Manage Unassigned Events"** button in the sidebar (yellow warning button)
3. Click **"Claim Events"**
4. Confirm the action
5. All events will be assigned to your account
6. The page will refresh automatically

### Option 2: Delete Existing Events 🗑️

Permanently delete all unassigned events. Use this if:
- You want a fresh start
- The old events are test data
- Multiple users have been creating events and you want to start clean

**How to do it:**
1. Log in to your account
2. Look for a **"Manage Unassigned Events"** button in the sidebar
3. Click **"Delete Events"**
4. Confirm the action (will ask twice for safety)
5. All unassigned events will be permanently deleted
6. The page will refresh automatically

## Manual Migration (Advanced)

If you need more control, you can use the browser console:

### Check for unassigned events:
```javascript
import { countEventsWithoutUser } from './utils/migrateEvents';
const count = await countEventsWithoutUser();
console.log(`Found ${count} unassigned events`);
```

### Migrate events to current user:
```javascript
import { migrateEventsToUser } from './utils/migrateEvents';
import { auth } from './firebase';
const count = await migrateEventsToUser(auth.currentUser.uid);
console.log(`Migrated ${count} events`);
```

### Delete unassigned events:
```javascript
import { deleteEventsWithoutUser } from './utils/migrateEvents';
const count = await deleteEventsWithoutUser();
console.log(`Deleted ${count} events`);
```

## What Happens After Migration

### If you claimed events:
- ✅ All events are now visible only to you
- ✅ Other users (if any) won't see these events
- ✅ New events you create will also be private to your account
- ✅ The yellow warning button will disappear

### If you deleted events:
- ✅ All old events are removed
- ✅ You start with a clean slate
- ✅ New events you create will be private to your account
- ✅ The yellow warning button will disappear

## Multiple Users

If you have multiple users who each created some events:

1. **Option A**: Have each user log in and claim their own events
   - First user logs in and claims events → their events are assigned to them
   - But this assigns ALL events to the first user
   - Not ideal for multi-user scenarios

2. **Option B**: Delete all old events and start fresh
   - Cleaner approach for multiple users
   - Each user starts with their own private events
   - Recommended for multi-user setups

3. **Option C**: Manual database migration
   - More complex, requires database access
   - Can selectively assign events based on custom logic
   - Contact a developer for assistance

## Preventing This Issue

Going forward, this won't be an issue because:
- ✅ All new events automatically include `userId`
- ✅ Events are filtered by user on load
- ✅ Each user only sees their own events
- ✅ No migration needed for new events

## Troubleshooting

### "I don't see the migration button"
- There are no unassigned events in your database
- You're all set! No action needed.

### "Migration failed"
- Check your internet connection
- Ensure you have permission to write to Firestore
- Check browser console for detailed error messages
- Try refreshing and attempting again

### "I migrated but still see the button"
- The button checks on page load
- Refresh the page manually if it doesn't auto-refresh
- Clear your browser cache if needed

### "I accidentally deleted events"
- Unfortunately, deleted events cannot be recovered
- Make sure you have Firebase backups enabled
- Contact your Firebase admin for potential restoration from backups

## Database Security

After migration, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{eventId} {
      // Users can only read/write their own events
      allow read, write: if request.auth != null && 
                           request.resource.data.userId == request.auth.uid &&
                           resource.data.userId == request.auth.uid;
    }
  }
}
```

This ensures:
- Users must be authenticated
- Users can only access events with their `userId`
- Events without `userId` are inaccessible to everyone

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify you're logged in
3. Check your Firestore permissions
4. Review the `AUTHENTICATION_SETUP.md` guide
5. Contact your development team


