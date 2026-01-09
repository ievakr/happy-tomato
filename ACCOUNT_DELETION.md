# Account Deletion Guide

## Overview

Users can now permanently delete their accounts from the Happy Tomato calendar app. This feature includes automatic cleanup of all user data.

## How to Delete Your Account

### Step 1: Access Account Settings

1. **Log in** to your account
2. Click your **avatar/initials** in the top-right corner
3. Click **"Account Settings"** from the dropdown menu

### Step 2: Navigate to Danger Zone

In the Account Settings modal, scroll down to the **"⚠️ Danger Zone"** section at the bottom.

### Step 3: Initiate Deletion

1. Click **"Delete Account"** button
2. Read the warning message carefully
3. **For Email/Password users**: Enter your password to confirm
4. **For Google users**: You'll be prompted to sign in with Google again
5. Click **"Delete My Account"**
6. Confirm the final warning

### Step 4: Account Deleted

- Your account is immediately deleted
- All your events are permanently removed
- You're automatically logged out
- You're redirected to the login screen

## What Gets Deleted

When you delete your account, the following data is permanently removed:

✅ **User Account**
- Your Firebase Auth account
- Login credentials
- Profile information (name, email, photo)

✅ **Events**
- All calendar events you created
- All recurring TO-DOs
- All event labels and categories

✅ **User Data**
- Any other data associated with your user ID

## Important Warnings

### ⚠️ THIS ACTION CANNOT BE UNDONE

- Once deleted, your account and data **cannot be recovered**
- There is no "undo" option
- You cannot restore deleted events
- You'll need to create a new account if you want to use the app again

### 🔒 Security Measures

For your security, account deletion requires:

1. **Email/Password Users**: Must enter current password
2. **Google Users**: Must reauthenticate with Google
3. **Recent Login**: If you haven't logged in recently, you'll need to log out and log back in before deletion

### ⏱️ Timing

- **Immediate**: Account and data deletion happens instantly
- **No Grace Period**: There's no waiting period or recovery window
- **No Backup**: The app doesn't create backups before deletion

## Technical Details

### Authentication Methods

#### Email/Password Users
```
1. Click "Delete Account"
2. Enter your current password
3. Confirm deletion
4. Account deleted immediately
```

#### Google Users
```
1. Click "Delete Account"
2. Google popup appears for reauthentication
3. Sign in with Google
4. Confirm deletion
5. Account deleted immediately
```

### Error Handling

**"Incorrect password"**
- You entered the wrong password
- Try again with the correct password

**"For security reasons, please log out and log back in"**
- Your login session is too old
- Log out and log back in
- Try deleting again

**"Please allow popups"**
- (Google users only) Browser blocked the popup
- Allow popups for this site
- Try again

**"Failed to delete account"**
- Network error or other issue
- Check your internet connection
- Try again later
- Contact support if issue persists

## For Developers

### Implementation

Account deletion is implemented in multiple layers:

**1. AuthContext** (`src/context/AuthContext.js`)
```javascript
// Delete account method with reauthentication
async function deleteAccount(password = null) {
  await reauthenticate(password);
  await deleteUser(currentUser);
}
```

**2. Data Cleanup** (`src/utils/deleteUserData.js`)
```javascript
// Delete all user's events before account deletion
async function deleteUserEvents(userId) {
  // Batch delete all events where userId matches
}
```

**3. UI Component** (`src/components/settings/AccountSettings.js`)
```javascript
// Account settings modal with deletion flow
// - Shows warnings
// - Handles password input
// - Manages deletion process
```

### Data Cleanup Order

1. **Delete User Data First**
   - Query all events with `userId == user.uid`
   - Batch delete events (max 500 per batch)
   - Remove any other user-specific data

2. **Delete Auth Account Second**
   - Reauthenticate user
   - Call `deleteUser(currentUser)`
   - User automatically logged out

### Database Structure

**Before Deletion:**
```javascript
// Firestore events collection
{
  "event123": {
    userId: "user-abc-123",
    title: "Water tomatoes",
    // ... other fields
  },
  "event456": {
    userId: "user-abc-123",
    title: "Fertilize plants",
    // ... other fields
  }
}

// Firebase Auth
{
  uid: "user-abc-123",
  email: "user@example.com",
  displayName: "User Name"
}
```

**After Deletion:**
```javascript
// Firestore events collection
{
  // user's events deleted
}

// Firebase Auth
{
  // user account deleted
}
```

### Security Rules

Recommended Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{eventId} {
      // Users can only delete their own events
      allow delete: if request.auth != null && 
                      resource.data.userId == request.auth.uid;
    }
  }
}
```

### Testing

**Test Account Deletion Flow:**

1. **Create test account**
   ```
   - Sign up with test email
   - Create some events
   - Note the number of events
   ```

2. **Delete account (Email/Password)**
   ```
   - Open Account Settings
   - Click Delete Account
   - Enter password
   - Confirm deletion
   - Verify redirected to login
   ```

3. **Verify data deletion**
   ```
   - Check Firestore - events should be gone
   - Check Firebase Auth - account should be gone
   - Try logging in - should fail
   ```

4. **Test with Google Sign-In**
   ```
   - Create account with Google
   - Create events
   - Delete account
   - Reauthenticate with Google popup
   - Confirm deletion
   - Verify data removed
   ```

## API Reference

### AuthContext Methods

**`deleteAccount(password)`**
- Deletes the current user's account
- Parameters:
  - `password` (string, optional): Required for email/password users
- Returns: Promise
- Throws: Error if reauthentication fails or deletion fails

**`reauthenticate(password)`**
- Reauthenticates the current user
- Required before account deletion
- Automatically detects Google vs email/password
- Parameters:
  - `password` (string, optional): Required for email/password users
- Returns: Promise
- Throws: Error if reauthentication fails

### Utility Functions

**`deleteUserEvents(userId)`**
- Located in `src/utils/deleteUserData.js`
- Deletes all events belonging to a user
- Parameters:
  - `userId` (string): The user ID whose events should be deleted
- Returns: Promise<number> - Count of deleted events

**`deleteAllUserData(userId)`**
- Located in `src/utils/deleteUserData.js`
- Deletes all data associated with a user
- Currently deletes events; extensible for future data types
- Parameters:
  - `userId` (string): The user ID whose data should be deleted
- Returns: Promise<Object> - Summary of deleted data

## GDPR Compliance

This implementation helps with GDPR compliance by:

✅ **Right to Erasure**: Users can delete their account and data
✅ **Complete Deletion**: All personal data is removed
✅ **Immediate Action**: No unnecessary delay in deletion
✅ **Transparent Process**: Clear warnings about what will be deleted
✅ **Secure Process**: Requires reauthentication for security

### For EU Users

Under GDPR, you have the right to:
- Delete your personal data (implemented ✅)
- Export your data (not yet implemented)
- Correct your data (via Account Settings)

## Future Enhancements

Possible improvements:

1. **Data Export**: Allow users to download their data before deletion
2. **Soft Delete**: Implement a grace period before permanent deletion
3. **Email Confirmation**: Send confirmation email after deletion
4. **Account Deactivation**: Option to deactivate instead of delete
5. **Backup**: Create a backup before deletion (admin only)
6. **Delete Scheduling**: Allow users to schedule deletion for future date

## Support

If you encounter issues with account deletion:

1. Check browser console for error messages
2. Ensure you're using the correct password
3. Try logging out and back in
4. Check your internet connection
5. Contact support with error details

## Related Documentation

- `AUTHENTICATION_SETUP.md` - Authentication implementation
- `USER_SPECIFIC_EVENTS.md` - User data isolation
- Firebase Auth Documentation: https://firebase.google.com/docs/auth
- GDPR Compliance: https://gdpr.eu/right-to-be-forgotten/



