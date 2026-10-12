# Secret Santa 🎅

A festive, cross-platform Secret Santa mobile and web application built with **React Native**, **Expo SDK 57**, **Expo Router v4**, **NativeWind v4**, and **Firebase v11**.

---

## ✨ Features

- 🎄 **Festive Christmas Theme**: Beautiful red, forest green, and gold styling powered by NativeWind and Tailwind CSS.
- 📱 **Cross-Platform**: Runs natively on iOS, Android, and web from a single codebase.
- 🔐 **Multi-Provider Authentication**:
  - Google OAuth (`expo-auth-session`)
  - Apple Sign-In (`expo-apple-authentication`)
  - Email & Password with Firebase Auth
- 🎁 **Raffle & Draw Management**:
  - Create Secret Santa raffles with custom budgets, deadlines, and descriptions.
  - Invite participants with instant deep links (`secretsanta://` and Universal Links).
  - Deterministic fair assignment algorithm without duplicate or self pairings.
- 🔔 **Push Notifications**: Expo Notifications combined with Firebase Cloud Messaging (FCM).
- ⚡ **Serverless Architecture**: Runs entirely within Firebase Spark free tier (Firestore + Storage + Hosting, no paid Cloud Functions required).

---

## 🛠️ Tech Stack Summary

- **Framework**: [Expo SDK 57](https://expo.dev) with New Architecture enabled
- **Core**: React Native 0.76.9 / React 19
- **Routing**: [Expo Router v4](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Styling**: [NativeWind v4.2](https://www.nativewind.dev/) & [Tailwind CSS v3.4](https://tailwindcss.com/)
- **Backend / Database**: [Firebase JS SDK v11](https://firebase.google.com/docs/web/setup) (Modular Firestore, Auth, Storage, Hosting)
- **Notifications**: `expo-notifications`
- **Builds & CI/CD**: Native GitHub Actions (`expo prebuild`, Gradle, Xcode) producing `.apk` and `.ipa` artifacts & GitHub Releases (EAS Cloud Build is **not** used or required).

---

## 📋 Prerequisites

Ensure you have the following installed locally:

- **Node.js**: v20 or v22 LTS
- **npm** or **yarn** / **pnpm** / **bun**
- **Firebase CLI**:
  ```bash
  npm install -g firebase-tools
  ```

---

## 🚀 Setup & Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/your-username/secret-santa-react-native-2026.git
cd secret-santa-react-native-2026
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Project Setup

1. Create a Firebase project at the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** with providers:
   - Email/Password
   - Google
   - Apple
3. Enable **Cloud Firestore** in production mode.
4. Enable **Firebase Storage**.
5. Enable **Firebase Hosting**.
6. Register a Web app, an Android app (`com.secretsanta.app`), and an iOS app (`com.secretsanta.app`).

### 4. Configure Environment Variables

Copy `.env.example` to `.env.local` and populate your Firebase and OAuth keys:

```bash
cp .env.example .env.local
```

### 5. Native Firebase Credentials

- **Android**: Download `google-services.json` from the Firebase Console and place it at the root of the project:
  ```
  google-services.json
  ```
- **iOS**: Download `GoogleService-Info.plist` and place it at the root of the project:
  ```
  GoogleService-Info.plist
  ```

### 6. Run Development Server

```bash
# Start Metro bundler
npx expo start

# Run on iOS simulator / device
npx expo run:ios

# Run on Android emulator / device
npx expo run:android

# Run in Web browser
npx expo start --web
```

---

## 📦 Native Builds & CI/CD (No EAS Required)

This project uses an **independent native build pipeline** via GitHub Actions instead of EAS Cloud Build. Expo Application Services (EAS) is **NOT required**.

### Local Native Builds

You can trigger native prebuild and compilation directly on your development machine:

```bash
# Android APK release build
npm run build:android

# iOS build (requires macOS with Xcode)
npm run build:ios
```

### Automated CI/CD Workflow (`.github/workflows/build-mobile.yaml`)

On every push to `main` (or manual trigger via `workflow_dispatch` with platform selection: `all`, `android`, or `ios`), GitHub Actions runs the native build pipeline:

1. **Android Build (`ubuntu-latest`)**:
   - Sets up Node.js 20 and Java 17 (Temurin).
   - Generates `google-services.json` from secret or uses dummy fallback with package `com.secretsanta.app`.
   - Runs `npx expo prebuild --platform android`.
   - Patches `android/gradle.properties` (`suppressKotlinVersionCompatibilityCheck=true`, `kotlinVersion=1.9.25`) and `android/build.gradle` for Kotlin Compose compiler compatibility.
   - Compiles release APK via `./gradlew assembleRelease -PkotlinVersion=1.9.25`.
   - Uploads artifact `secret-santa-android` (`android/app/build/outputs/apk/release/app-release.apk`).
   - Publishes `secret-santa.apk` to GitHub Release tagged `latest-build`.

2. **iOS Build (`macos-14`)**:
   - Sets up Node.js 20.
   - Generates `GoogleService-Info.plist` from secret or uses dummy fallback with bundle ID `com.secretsanta.app`.
   - Caches CocoaPods dependencies.
   - Runs `npx expo prebuild --platform ios`.
   - Automatically patches `ios/Podfile` via Python for modular headers on Firebase/Google pods, sets `IPHONEOS_DEPLOYMENT_TARGET` to 15.1, and configures `CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES=YES` and `DEFINES_MODULE=YES`.
   - Runs `pod install --repo-update`.
   - Compiles unsigned `.app` with `xcodebuild` (`CODE_SIGNING_ALLOWED=NO`).
   - Packages `.app` into `secret-santa-ios.ipa` using a standard `Payload/` zip archive.
   - Uploads artifact `secret-santa-ios` (`secret-santa-ios.ipa`).
   - Publishes `secret-santa.ipa` to GitHub Release tagged `latest-build`.

3. **Artifact Pruning (`prune-artifacts`)**:
   - Retains the 3 most recent builds of each app in GitHub Actions storage to prevent quota exhaustion.

---

## 🔒 Firebase Security Rules & Deployment

Deploy Firestore rules, Storage rules, and Firestore indexes using the Firebase CLI:

```bash
# Authenticate with Firebase
firebase login

# Select default project
firebase use --add

# Deploy security rules and indexes
firebase deploy --only firestore:rules,firestore:indexes,storage
```

---

## 🤖 GitHub Actions Secrets

When setting up automated CI/CD workflows, configure the following repository secrets:

| Secret Name | Description | Required / Optional |
|---|---|---|
| `GOOGLE_SERVICES_JSON` | Content of Firebase `google-services.json` for Android | Optional (dummy fallback provided) |
| `GOOGLE_SERVICE_INFO_PLIST` | Content of Firebase `GoogleService-Info.plist` for iOS | Optional (dummy fallback provided) |
| `FIREBASE_SERVICE_ACCOUNT` | Service account JSON key for deploying Firebase Hosting/Rules | Required for web hosting deploy |

---

## 🏗️ Architecture Notes

- **Client-Side Secret Santa Draw**:
  Since this project runs strictly on Firebase's free Spark plan without Cloud Functions, the raffle drawing logic is executed securely on the manager's client using a derangement algorithm (guaranteeing no participant draws themselves).
- **Data Model**:
  - `/users/{userId}`: User profile, display name, avatar, wishlist.
  - `/raffles/{raffleId}`: Raffle metadata (title, manager ID, budget, status, deadline).
  - `/raffles/{raffleId}/participants/{participantId}`: Participant status, assigned recipient (encrypted/masked as needed), push token.
- **Deep Linking**:
  Universal Links (`https://secret-santa-app-xxxx.web.app/*`) and Custom Scheme (`secretsanta://*`) direct users straight into the relevant raffle invitation screen.
# secret-santa-2026
