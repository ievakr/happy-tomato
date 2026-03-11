# Happy Tomato

A calendar app for garden and plant management. Track events, recurring TODOs, and plant care with Firebase-backed storage. Includes email reminders, offline support, and responsive month/week/daily views.

## Setup

### 1. Clone and install

```bash
git clone <repository-url>
cd happy-tomato
npm install
```

### 2. Environment variables

Copy the example env file and fill in your Firebase credentials:

```bash
cp .env.example .env
```

Edit `.env` with your Firebase config values. Required variables:

| Variable | Description |
|----------|-------------|
| `REACT_APP_FIREBASE_API_KEY` | Firebase API key |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | `your-project-id.firebaseapp.com` |
| `REACT_APP_FIREBASE_PROJECT_ID` | Firebase project ID |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | `your-project-id.appspot.com` |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `REACT_APP_FIREBASE_APP_ID` | Firebase app ID |
| `REACT_APP_FIREBASE_MEASUREMENT_ID` | (Optional) Analytics measurement ID |

Get these from [Firebase Console](https://console.firebase.google.com/) → Project Settings → Your apps → Config.

## Usage

### Development

```bash
npm start
```

Runs the app at [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm build
```

Builds the app for production to the `build` folder.

### Tests

```bash
npm test
```

## Firebase setup

### Firestore

- Create a Firestore database in your Firebase project.
- Deploy rules: `firebase deploy --only firestore`
- Collections: `events`, `plants`, `emailPreferences` (user-scoped by `userId`)

### Authentication

- Enable Anonymous or Email/Password auth in Firebase Console.
- The app uses Firebase Auth for user identification.

### Hosting

Deploy the built app:

```bash
npm run build
firebase deploy --only hosting
```

### Firebase Functions (optional)

Email reminders use Cloud Functions. To enable:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Set SendGrid config:

```bash
firebase functions:config:set sendgrid.api_key="your-sendgrid-api-key"
firebase functions:config:set sendgrid.from_email="your-verified-sender@example.com"
```

4. Deploy functions:

```bash
firebase deploy --only functions
```

Reminders run on a schedule (Europe/Vilnius timezone). Without Functions, email reminders work in-browser only when the app is open.
