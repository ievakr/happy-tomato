# Firestore Security Rules - Quick Reference

Quick commands and tips for managing Firestore Security Rules.

## 🚀 Quick Deploy Commands

```bash
# Deploy only Firestore rules (fastest)
firebase deploy --only firestore:rules

# Deploy rules and functions
firebase deploy --only firestore:rules,functions

# Deploy everything
firebase deploy

# Test rules locally
firebase emulators:start
```

## 📝 Common Rule Patterns

### Check User Owns Resource

```javascript
// In firestore.rules
function isOwner(userId) {
  return request.auth != null && request.auth.uid == userId;
}

// Usage
allow read: if isOwner(resource.data.userId);
```

### Validate Required Fields

```javascript
// Ensure required fields exist on create
allow create: if request.resource.data.keys().hasAll(['userId', 'day']);
```

### Prevent Field Changes

```javascript
// Prevent userId from being changed on update
allow update: if request.resource.data.userId == resource.data.userId;
```

## 🧪 Testing Checklist

- [ ] User can read own events
- [ ] User cannot read other user's events  
- [ ] User can create events with own userId
- [ ] User cannot create events for other users
- [ ] User can update own events
- [ ] User cannot change userId on update
- [ ] User can delete own events
- [ ] User cannot delete other user's events
- [ ] Email preferences work correctly

## 🔍 Debug Commands

```bash
# Check Firebase project
firebase projects:list

# Get current rules
firebase firestore:rules get

# View logs
firebase functions:log
```

## 📊 Rule Structure

```
firestore.rules
├── Helper Functions
│   ├── isAuthenticated()
│   ├── isOwner(userId)
│   ├── isSettingOwnUserId()
│   └── userIdNotChanged()
├── Events Collection Rules
│   ├── read
│   ├── create
│   ├── update
│   └── delete
├── Email Preferences Rules
│   ├── read
│   ├── create
│   ├── update
│   └── delete
└── Default Deny All
```

## ⚡ Quick Fixes

### Fix: Permission Denied on Read

```javascript
// Add userId filter to query
const q = query(
  collection(db, 'events'),
  where('userId', '==', currentUser.uid)  // Add this!
);
```

### Fix: Permission Denied on Create

```javascript
// Include userId in new document
await addDoc(collection(db, 'events'), {
  userId: currentUser.uid,  // Add this!
  title: 'Water plants',
  day: '2026-01-15'
});
```

### Fix: Permission Denied on Update

```javascript
// Don't change userId in updates
await updateDoc(doc(db, 'events', eventId), {
  // userId: 'different-user',  // ❌ Don't do this!
  title: 'Updated title',       // ✅ OK
  completed: true                // ✅ OK
});
```

## 📱 Test in Browser Console

```javascript
// Check if user is authenticated
console.log('User:', auth.currentUser);

// Test reading events
const events = await getDocs(query(
  collection(db, 'events'),
  where('userId', '==', auth.currentUser.uid)
));
console.log('Events:', events.docs.length);
```

## 🔗 Useful Links

- [Firebase Console](https://console.firebase.google.com)
- [Firestore Rules Reference](https://firebase.google.com/docs/firestore/security/rules-structure)
- [Rules Playground](https://console.firebase.google.com → Firestore → Rules → Playground)

---

**Pro Tip**: Always test rules locally with emulators before deploying to production!

```bash
firebase emulators:start
# Test at http://localhost:3000
# Rules auto-reload when firestore.rules changes
```

