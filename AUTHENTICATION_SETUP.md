# Firebase Authentication Setup

This document explains the Firebase Authentication implementation in the Happy Tomato calendar app.

## Features

✅ Email/Password Authentication
✅ Google Sign-In
✅ Password Reset
✅ User Profile Management
✅ Protected Routes
✅ User Menu with Logout
✅ Account Deletion with Data Cleanup

## What Was Added

### 1. Firebase Configuration (`src/firebase.js`)
- Added Firebase Authentication import and initialization
- Exported `auth` instance for use throughout the app

### 2. Authentication Context (`src/context/AuthContext.js`)
- Centralized authentication state management
- Provides authentication methods:
  - `signup(email, password, displayName)` - Create new account
  - `login(email, password)` - Sign in with email/password
  - `loginWithGoogle()` - Sign in with Google
  - `logout()` - Sign out user
  - `resetPassword(email)` - Send password reset email
  - `updateUserProfile(updates)` - Update user profile
- Provides `currentUser` object with user information

### 3. Authentication Components (`src/components/auth/`)
- **Login.js** - Login form with email/password and Google sign-in
- **Signup.js** - Registration form with validation
- **ForgotPassword.js** - Password reset form
- **AuthWrapper.js** - Protects the app, shows auth screens when not logged in
- **UserMenu.js** - User dropdown menu in header with logout
- **Auth.css** - Modern, responsive styles for auth components
- **UserMenu.css** - Styles for user menu dropdown

### 4. Integration
- **index.js** - Wrapped app with `AuthProvider`
- **App.js** - Wrapped main app content with `AuthWrapper`
- **Header.js** - Added `UserMenu` component to header (desktop and mobile)

## How It Works

### Authentication Flow

1. **Unauthenticated Users**: When a user is not logged in, they see the login screen
2. **Login/Signup**: Users can sign in with email/password or Google
3. **Authenticated Access**: Once authenticated, users can access the full calendar app
4. **User Menu**: Logged-in users see their avatar/initials in the header
5. **Logout**: Users can sign out via the user menu dropdown

### User Data

The `currentUser` object contains:
```javascript
{
  uid: 'user-id',
  email: 'user@example.com',
  displayName: 'User Name',
  photoURL: 'https://...',
  // ... other Firebase user properties
}
```

### Using Authentication in Components

To access authentication in any component:

```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { currentUser, logout } = useAuth();
  
  return (
    <div>
      <p>Welcome, {currentUser.displayName}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Firebase Console Setup

### Enable Authentication Methods

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** > **Sign-in method**
4. Enable the following providers:
   - ✅ Email/Password
   - ✅ Google (configure OAuth consent screen)

### Configure Authorized Domains

1. In **Authentication** > **Settings** > **Authorized domains**
2. Add your domains:
   - `localhost` (for development)
   - Your production domain (e.g., `your-app.web.app`)

### Google OAuth Setup

1. Enable Google sign-in provider
2. Add your Web client ID (from Google Cloud Console)
3. Configure OAuth consent screen in Google Cloud Console
4. Add authorized JavaScript origins and redirect URIs

## Security Rules

Update your Firestore security rules to require authentication:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Require authentication for all reads/writes
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // More specific rules:
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /events/{eventId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

## User-Specific Data

Events are now automatically user-specific! The implementation includes:

✅ **Automatic userId Assignment**: When creating events, the current user's ID is automatically added
✅ **Filtered Queries**: Events are loaded with a `where("userId", "==", currentUserId)` filter
✅ **Privacy**: Each user only sees their own events

### Migration for Existing Events

If you have existing events created before authentication was added, you'll need to migrate them:

1. **Look for the yellow "Manage Unassigned Events" button** in the sidebar when logged in
2. Choose to either:
   - **Claim Events**: Assign all unassigned events to your account
   - **Delete Events**: Permanently remove all unassigned events

See `EVENT_MIGRATION_GUIDE.md` for detailed migration instructions.

### How It Works

The event system has been updated:

### Implementation Details

**Event Creation** (`src/context/ContextWrapper.js`):
```javascript
// When adding an event, userId is automatically added
case "push":
  const eventWithUserId = {
    ...payload,
    userId: currentUser.uid  // Automatically added
  };
  await addDoc(collection(db, "events"), eventWithUserId);
```

**Event Loading** (`src/context/ContextWrapper.js`):
```javascript
// Events are filtered by userId when loading
async function fetchEvents(userId) {
  const eventsQuery = query(
    collection(db, "events"),
    where("userId", "==", userId)  // Only load user's events
  );
  const snapshot = await getDocs(eventsQuery);
  // ... process events
}
```

This means you don't need to manually add `userId` when creating events - it's handled automatically!

## Styling

The authentication screens feature:
- Modern gradient background
- Smooth animations
- Responsive design (mobile-friendly)
- Clean, professional UI
- Loading states
- Error handling
- Accessible form elements

## Testing

To test authentication:

1. **Sign Up**: Create a new account with email/password
2. **Sign In**: Log in with the created account
3. **Google Sign-In**: Test Google OAuth flow
4. **Password Reset**: Test forgot password flow
5. **User Menu**: Check user menu dropdown in header
6. **Logout**: Test sign out functionality
7. **Protected Routes**: Verify app is accessible only when authenticated

## Troubleshooting

### "auth/configuration-not-found"
- Enable authentication methods in Firebase Console

### "auth/unauthorized-domain"
- Add your domain to authorized domains in Firebase Console

### "auth/popup-blocked"
- Google sign-in popup was blocked - allow popups for your domain

### User not persisting after refresh
- Check that AuthProvider is wrapping your app in index.js
- Ensure auth state listener is working in AuthContext

## Account Deletion

Users can permanently delete their accounts:

1. Click avatar/initials in header
2. Select "Account Settings"
3. Navigate to "Danger Zone"
4. Click "Delete Account"
5. Confirm with password (or Google reauthentication)
6. Account and all data are permanently deleted

See `ACCOUNT_DELETION.md` for complete documentation.

### What Gets Deleted
- ✅ User authentication account
- ✅ All user events
- ✅ All user data

### Security
- Requires reauthentication before deletion
- Email/password users must enter password
- Google users must reauthenticate with popup
- Cannot be undone

## Next Steps (Optional)

Consider adding:
- Email verification
- Multi-factor authentication
- Social login (Facebook, Twitter, etc.)
- Anonymous authentication
- Phone authentication
- Custom user profiles
- Profile picture upload
- Data export (before deletion)

## Resources

- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [React Firebase Hooks](https://github.com/CSFrequency/react-firebase-hooks)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

