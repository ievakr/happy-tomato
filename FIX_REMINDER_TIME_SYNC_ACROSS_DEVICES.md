# 🔧 Fixed: Daily Reminder Time Different Between Desktop and Mobile

## The Problem

You reported that the daily reminder time shows different values on desktop vs mobile devices.

### What Was Happening

The email preferences (including `reminderTime`) were stored separately on each device:
- **Desktop browser**: localStorage stores `reminderTime: "14:00"`
- **Mobile browser**: localStorage stores `reminderTime: "09:00"`
- **Cloud Functions**: Read from Firestore (whichever device last updated it)

The issue was that **each device had its own localStorage**, but there was no synchronization mechanism to load preferences FROM Firestore when the app starts.

```
Desktop                Mobile               Firestore
localStorage      →    localStorage    →    Database
reminderTime: 14:00    reminderTime: 09:00  reminderTime: 14:00 (from last update)

❌ Problem: Desktop changes time → Firestore updates → Mobile still shows old time!
```

### Why It Happened

1. **Initial implementation only wrote TO Firestore**, but never read FROM it
2. Each device loaded preferences from its own localStorage on startup
3. When you changed settings on one device:
   - ✅ Firestore was updated
   - ✅ Cloud Functions used the new value
   - ❌ Other devices still had old values in localStorage

## The Solution

**Implement bidirectional sync with Firestore as the source of truth:**

### Changes Made to `src/hooks/useEmailNotifications.js`

#### 1. Added `getDoc` Import
```javascript
import { doc, setDoc, getDoc } from 'firebase/firestore';
```

#### 2. Added `updatedAt` Timestamp to Track Versions
```javascript
const updateEmailPreferences = (newPreferences) => {
  setEmailPreferences(prev => {
    const updated = { 
      ...prev, 
      ...newPreferences,
      updatedAt: new Date().toISOString() // Track which version is newest
    };
    // ... rest of logic
  });
};
```

#### 3. Load Preferences from Firestore on Startup
Added a new `useEffect` that runs once when the hook mounts:

```javascript
useEffect(() => {
  const loadFromFirestore = async () => {
    const saved = localStorage.getItem('email-preferences');
    if (!saved) return; // No local preferences yet
    
    const localPrefs = JSON.parse(saved);
    if (!localPrefs.userEmail) return; // No email configured yet
    
    try {
      const docId = localPrefs.userEmail.replace(/[.#$[\]]/g, '_');
      const docRef = doc(db, 'emailPreferences', docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const firestorePrefs = docSnap.data();
        
        // Compare timestamps to determine which is newer
        const localUpdated = localPrefs.updatedAt || 0;
        const firestoreUpdated = firestorePrefs.updatedAt || 0;
        
        if (firestoreUpdated > localUpdated) {
          console.log('📥 Loading newer preferences from Firestore');
          // Update local state with Firestore data
          setEmailPreferences(prev => ({
            ...prev,
            ...firestorePrefs
          }));
        } else if (localUpdated > firestoreUpdated) {
          console.log('📤 Local preferences are newer, syncing to Firestore');
          // Sync local to Firestore
          syncPreferencesToFirestore(localPrefs);
        }
      } else {
        // No Firestore data yet, sync local to Firestore
        syncPreferencesToFirestore(localPrefs);
      }
    } catch (error) {
      console.error('❌ Failed to load preferences from Firestore:', error);
    }
  };
  
  loadFromFirestore();
}, []); // Run once on mount
```

## How It Works Now

### Scenario 1: You Change Settings on Desktop

1. **Desktop**: User changes `reminderTime` from `09:00` to `14:00`
2. **Desktop**: `updateEmailPreferences()` is called
3. **Desktop**: Updates localStorage with `updatedAt: "2025-10-28T10:30:00Z"`
4. **Desktop**: Syncs to Firestore with same timestamp
5. **Mobile**: Next time you open the app
   - Loads localStorage (has old time `09:00` with old timestamp)
   - Checks Firestore
   - Sees Firestore has newer timestamp
   - **Updates local state to `14:00`** ✅
   - Saves to localStorage

### Scenario 2: You Change Settings on Mobile

1. **Mobile**: User changes `reminderTime` from `14:00` to `16:00`
2. **Mobile**: Updates localStorage + Firestore with new timestamp
3. **Desktop**: Next time you open the app
   - Checks Firestore
   - Sees newer timestamp
   - **Updates to `16:00`** ✅

### Scenario 3: Offline Changes

If you make changes while offline:
- Changes save to localStorage immediately
- When back online, the next `updateEmailPreferences()` call will sync to Firestore
- Or on next app load, if local timestamp is newer, it syncs to Firestore

## Benefits

✅ **Single source of truth**: Firestore is the authoritative source
✅ **Automatic sync**: Happens on app startup
✅ **Conflict resolution**: Uses timestamps to determine which version is newest
✅ **Works offline**: Changes save locally first, sync when online
✅ **No data loss**: Preserves more recent timestamps when syncing

## Testing the Fix

### Test Sync Between Devices

1. **On Desktop**:
   - Open the app
   - Go to Settings → Email Notifications
   - Change reminder time to `14:00`
   - Save

2. **On Mobile**:
   - Open the app (or refresh the page)
   - Go to Settings → Email Notifications
   - **You should see `14:00`** ✅

3. **Check Console Logs**:
   - Open browser console (desktop or mobile)
   - Look for: `📥 Loading newer preferences from Firestore`
   - You should see the `reminderTime` value loaded from Firestore

### Test Reverse Sync (Mobile → Desktop)

1. **On Mobile**:
   - Change reminder time to `16:00`
   - Save

2. **On Desktop**:
   - Refresh the page
   - Go to Settings
   - **You should see `16:00`** ✅

## Technical Notes

### Timestamp Format
- Uses ISO 8601 format: `new Date().toISOString()`
- Example: `"2025-10-28T10:30:00.000Z"`
- This format is comparable as strings (lexicographically)

### Email as Document ID
- Sanitizes email for Firestore: `email.replace(/[.#$[\]]/g, '_')`
- Example: `user@example.com` → `user@example_com`

### Cloud Functions Still Work
- Cloud Functions continue to read from Firestore (no changes needed)
- They use the `reminderTime` from Firestore, which is now always up to date

## Files Modified

- `src/hooks/useEmailNotifications.js`
  - Added `getDoc` import from `firebase/firestore`
  - Moved `syncPreferencesToFirestore` function earlier in the code
  - Added `updatedAt` timestamp to `updateEmailPreferences`
  - Added new `useEffect` to load preferences from Firestore on mount
  - Removed duplicate `syncPreferencesToFirestore` function

## What's Next

The sync happens automatically now. Just:
1. Change settings on any device
2. Open the app on another device
3. Settings automatically sync ✅

**Note**: The sync happens on app load/refresh. For real-time sync across devices (without refresh), you would need to implement Firestore listeners, but for most use cases, sync-on-load is sufficient.

