# LingoLive Mobile App

Flutter mobile application for LingoLive AI - Interactive language learning with AI assistance.

## Getting Started

### Prerequisites
- Flutter SDK >= 3.0.0
- Dart >= 3.0.0
- Android Studio / Xcode (for mobile development)
- Firebase account with project configured

### Setup

1. **Install Flutter dependencies:**
   ```bash
   flutter pub get
   ```

2. **Configure Firebase:**
   - Update `lib/firebase_options.dart` with your Firebase project credentials
   - Or use FlutterFire CLI: `flutterfire configure`

3. **Run the app:**
   ```bash
   flutter run
   ```

## Project Structure

```
lib/
├── main.dart              # App entry point
├── firebase_options.dart  # Firebase configuration
├── services/
│   └── auth_service.dart  # Firebase Auth service
├── screens/
│   ├── login_screen.dart  # Authentication UI
│   └── dashboard_screen.dart # Main app UI
└── theme/
    └── app_theme.dart     # App theme configuration
```

## Features

- ✅ Firebase Authentication (Email/Password)
- ✅ User Dashboard with multiple tabs
- ✅ Course management interface
- ✅ User profile management
- ✅ Daily learning goals
- ✅ Dark/Light theme support
- ✅ Responsive Material 3 UI

## Building

### Android APK
```bash
flutter build apk --release
```

### iOS
```bash
flutter build ios --release
```

### Web
```bash
flutter build web --release
```

## CI/CD

This project is integrated with GitHub Actions. The mobile build is triggered on every push to `main`:
- Fase 3: Mobile Build (Flutter) - generates APK artifacts

## Dependencies

- `firebase_core`, `firebase_auth`, `cloud_firestore` - Firebase services
- `provider` - State management
- `http`, `dio` - HTTP client
- `shared_preferences` - Local storage

## Notes

- Firebase config keys in `firebase_options.dart` need to be populated with actual project credentials
- This is a production-ready structure that can be extended with additional features
