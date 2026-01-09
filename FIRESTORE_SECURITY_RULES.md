# Firestore Security Rules

This document explains the Firestore Security Rules implemented for the Happy Tomato calendar application.

## 📋 Overview

The security rules protect your data by ensuring:
- ✅ Only authenticated users can access the database
- ✅ Users can only read and modify their own data
- ✅ Data integrity is maintained (required fields are enforced)
- ✅ Cloud Functions can read email preferences for automated reminders

## 🔒 Collections Protected

### 1. Events Collection (`/events/{eventId}`)

**Purpose**: Stores user-specific calendar events for plant care activities.

**Security Rules**:

| Operation | Rule | Description |
|-----------|------|-------------|
| **Read** | `resource.data.userId == request.auth.uid` | Users can only read their own events |
| **Create** | `request.resource.data.userId == request.auth.uid` | Users can only create events with their own userId |
| **Update** | `resource.data.userId == request.auth.uid && userId not changed` | Users can update their own events but cannot change ownership |
| **Delete** | `resource.data.userId == request.auth.uid` | Users can only delete their own events |

**Required Fields** (enforced on create):
- `userId` (string) - Must match authenticated user's UID
- `day` (string) - Date of the event

**Example Event Document**:
```javascript
{
  id: "event123",
  userId: "user-abc-123",
  title: "Water tomatoes",
  day: "2026-01-15",
  labels: ["Tomato", "Watering"],
  toDo: "TO DO: Water tomatoes",
  completed: false,
  isRecurringTodo: true
}
```

### 2. Email Preferences Collection (`/emailPreferences/{docId}`)

**Purpose**: Stores user email notification preferences for TODO reminders.

**Document ID Format**: Sanitized email address (special characters replaced with underscores)
- Example: `user@example.com` → `user@example_com`

**Security Rules**:

| Operation | Rule | Description |
|-----------|------|-------------|
| **Read** | `userEmail field matches authenticated user's email` | Users can read their own preferences |
| **Create** | `userEmail field matches authenticated user's email` | Users can create their own preferences with their own email |
| **Update** | `userEmail field matches authenticated user's email` | Users can update their own preferences |
| **Delete** | `userEmail field matches authenticated user's email` | Users can delete their own preferences |

**Note**: The rules check the `userEmail` field in the document rather than matching the document ID, which is more reliable and simpler.

**Example Email Preferences Document**:
```javascript
{
  enabled: true,
  userEmail: "user@example.com",
  userName: "John Doe",
  dailyReminder: true,
  reminderTime: "09:00",
  overdueReminders: true,
  dueTodayReminders: true,
  advanceReminders: true,
  advanceDays: 3,
  lastAutoReminderSent: 1704801600000,
  lastAutoAdvanceReminderSent: 1704801600000,
  updatedAt: "2026-01-09T12:00:00.000Z"
}
```

## 🚀 Deployment

### Deploy Security Rules

```bash
# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Or deploy everything (hosting, functions, rules)
firebase deploy
```

### View Current Rules

```bash
# View deployed rules in Firebase Console
# Go to: https://console.firebase.google.com
# Navigate to: Firestore Database → Rules
```

## 🧪 Testing Security Rules

### Local Testing with Emulator

```bash
# Start Firebase emulators
firebase emulators:start

# The emulator will use your firestore.rules file
# Test your app at http://localhost:3000
```

### Manual Testing Scenarios

#### ✅ Test 1: User Can Access Own Events

```javascript
// As user-abc-123
const eventsQuery = query(
  collection(db, 'events'),
  where('userId', '==', 'user-abc-123')
);
const snapshot = await getDocs(eventsQuery);
// ✅ Should succeed - user reading own events
```

#### ❌ Test 2: User Cannot Access Other User's Events

```javascript
// As user-abc-123, trying to access user-xyz-456's events
const eventsQuery = query(
  collection(db, 'events'),
  where('userId', '==', 'user-xyz-456')
);
const snapshot = await getDocs(eventsQuery);
// ❌ Should fail - permission denied
```

#### ✅ Test 3: User Can Create Event with Own userId

```javascript
// As user-abc-123
await addDoc(collection(db, 'events'), {
  userId: 'user-abc-123',
  title: 'Water plants',
  day: '2026-01-15'
});
// ✅ Should succeed
```

#### ❌ Test 4: User Cannot Create Event with Different userId

```javascript
// As user-abc-123, trying to create event for user-xyz-456
await addDoc(collection(db, 'events'), {
  userId: 'user-xyz-456',  // Wrong userId!
  title: 'Water plants',
  day: '2026-01-15'
});
// ❌ Should fail - permission denied
```

#### ✅ Test 5: User Can Update Own Event

```javascript
// As user-abc-123, updating own event
await updateDoc(doc(db, 'events', 'event123'), {
  title: 'Water tomatoes - DONE',
  completed: true
});
// ✅ Should succeed (event123 belongs to user-abc-123)
```

#### ❌ Test 6: User Cannot Change Event Ownership

```javascript
// As user-abc-123, trying to change userId
await updateDoc(doc(db, 'events', 'event123'), {
  userId: 'user-xyz-456',  // Trying to change owner!
  title: 'Water tomatoes'
});
// ❌ Should fail - cannot change userId
```

#### ✅ Test 7: User Can Manage Own Email Preferences

```javascript
// As user@example.com
const docId = 'user@example_com';
await setDoc(doc(db, 'emailPreferences', docId), {
  userEmail: 'user@example.com',
  enabled: true,
  reminderTime: '09:00'
});
// ✅ Should succeed
```

## 🔍 Debugging Rules

### Check Rules in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Click **Rules Playground** to test rules

### Enable Debugging in Code

```javascript
// Add this to see permission errors in console
import { enableIndexedDbPersistence } from 'firebase/firestore';

// This will log detailed error messages
try {
  await someFirestoreOperation();
} catch (error) {
  console.error('Firestore error:', error.code, error.message);
  // Common codes: 'permission-denied', 'not-found', 'unauthenticated'
}
```

### Common Error Codes

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `permission-denied` | User doesn't have access | Check if user is authenticated and owns the resource |
| `unauthenticated` | User is not signed in | Ensure user is logged in before Firestore operations |
| `not-found` | Document doesn't exist | Check document ID and path |
| `failed-precondition` | Missing required fields | Ensure all required fields are provided |

## 🛡️ Security Best Practices

### ✅ What These Rules Protect Against

1. **Unauthorized Access**: Users cannot read other users' events or preferences
2. **Data Tampering**: Users cannot modify the `userId` field to hijack events
3. **Malicious Creation**: Users cannot create events for other users
4. **Data Deletion**: Users cannot delete other users' data

### ⚠️ Important Notes

1. **Cloud Functions Have Admin Access**: Your Cloud Functions run with admin privileges and can read all data (needed for email reminders)

2. **Client-Side Queries Must Filter by userId**: Always include `where('userId', '==', currentUser.uid)` in your queries

3. **Events Without userId Are Inaccessible**: Old events without a `userId` field will be denied access. Use the migration tool if needed.

4. **Email Preferences Use Sanitized Emails**: Document IDs replace special characters (`.#$[]`) with underscores

## 📚 Related Documentation

- [Firebase Authentication Setup](./AUTHENTICATION_SETUP.md)
- [User-Specific Events Guide](./USER_SPECIFIC_EVENTS.md)
- [Event Migration Guide](./EVENT_MIGRATION_GUIDE.md)
- [Account Deletion Guide](./ACCOUNT_DELETION.md)

## 🔧 Troubleshooting

### Issue: "Permission denied" when accessing events

**Solution**: Ensure the user is authenticated and the query includes `where('userId', '==', currentUser.uid)`

```javascript
// ❌ Wrong - no userId filter
const eventsQuery = query(collection(db, 'events'));

// ✅ Correct - filtered by userId
const eventsQuery = query(
  collection(db, 'events'),
  where('userId', '==', currentUser.uid)
);
```

### Issue: "Permission denied" when creating events

**Solution**: Ensure the event includes the correct `userId` field

```javascript
// ❌ Wrong - missing userId
await addDoc(collection(db, 'events'), {
  title: 'Water plants',
  day: '2026-01-15'
});

// ✅ Correct - includes userId
await addDoc(collection(db, 'events'), {
  userId: currentUser.uid,  // Add this!
  title: 'Water plants',
  day: '2026-01-15'
});
```

### Issue: Cannot access old events without userId

**Solution**: Use the Event Migration tool in the app

1. Log in to your account
2. Click the yellow "Manage Unassigned Events" button in the sidebar
3. Choose to claim or delete unassigned events

See [EVENT_MIGRATION_GUIDE.md](./EVENT_MIGRATION_GUIDE.md) for details.

## 📞 Support

If you encounter issues with Firestore Security Rules:

1. Check the Firebase Console for rule errors
2. Review the Rules Playground in Firebase Console
3. Check browser console for detailed error messages
4. Verify user authentication status
5. Ensure all queries filter by `userId`

---

**Last Updated**: January 9, 2026
**Rules Version**: 2

