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
npm run build
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

## Mobile (Capacitor)

The app can be built as native iOS and Android apps using [Capacitor](https://capacitorjs.com/). The web version is unchanged; Capacitor wraps the same build in a native shell.

### Prerequisites

- **iOS**: Xcode (macOS only) and [CocoaPods](https://cocoapods.org/) (`brew install cocoapods`)
- **Android**: [Android Studio](https://developer.android.com/studio) and Android SDK

### First-time setup

1. Install dependencies and build:

   ```bash
   npm install
   npm run build
   ```

2. Add the native platforms (run once):

   ```bash
   npx cap add ios
   npx cap add android
   ```

3. For iOS, install CocoaPods dependencies:

   ```bash
   cd ios/App && pod install && cd ../..
   ```

### Running on device or simulator

After making changes to the React app:

```bash
npm run cap:sync    # Builds web app and syncs to native projects
```

Then open in your IDE:

```bash
npm run cap:ios     # Opens Xcode (build + sync + open)
npm run cap:android # Opens Android Studio (build + sync + open)
```

From Xcode or Android Studio, run the app on a simulator/emulator or connected device.

### App configuration

Edit `capacitor.config.ts` to change the app ID (`appId`) or display name (`appName`). The app ID is used for app store submission (e.g. `com.happytomato.app`).
