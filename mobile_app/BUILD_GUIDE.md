# LingoLive Flutter Mobile App - Build Guide

## Project Overview

LingoLive is a comprehensive AI-powered language learning platform with a full-featured Flutter mobile application. The app supports offline functionality, real-time collaboration, and seamless Firebase integration.

**Tech Stack:**
- Flutter SDK >= 3.0.0
- Firebase (Authentication, Firestore, Storage)
- Provider for state management
- Local caching with shared_preferences
- Offline-first architecture

---

## Prerequisites

### System Requirements
- Flutter SDK 3.0+ ([Install](https://flutter.dev/docs/get-started/install))
- Android Studio or Xcode for mobile development
- Dart SDK (bundled with Flutter)
- Git

### Development Environment Setup

```bash
# Verify Flutter installation
flutter doctor

# Install dependencies
cd mobile_app
flutter pub get

# Generate code (if needed for freezed annotations)
flutter pub run build_runner build
```

---

## Project Structure

```
mobile_app/
├── lib/
│   ├── main.dart                 # App entry point
│   ├── firebase_options.dart     # Firebase config
│   ├── screens/
│   │   ├── login_screen.dart     # Authentication UI
│   │   ├── dashboard_screen.dart # Main navigation hub
│   │   ├── vocabulary_practice_screen.dart
│   │   ├── ebook_reader_screen.dart
│   │   └── live_classes_screen.dart
│   ├── services/
│   │   ├── auth_service.dart
│   │   ├── local_cache_service.dart
│   │   └── realtime_sync_service.dart
│   ├── models/
│   │   └── sync_queue.dart       # All data models
│   ├── theme/
│   │   └── app_theme.dart
│   └── firebase_options.dart
├── integration_test/
│   ├── app_test.dart             # E2E test suite
│   └── firebase_setup.dart       # Firebase test config
├── pubspec.yaml                  # Dependencies
├── analysis_options.yaml          # Lint rules
└── BUILD_GUIDE.md               # This file
```

---

## Building the App

### Android Build

#### Debug Build (Development)
```bash
# Build APK for testing
flutter build apk --debug

# Run on connected device
flutter run

# Build APK for specific Android version
flutter build apk --target-platform android-arm64
```

#### Release Build (Production)
```bash
# Create release APK
flutter build apk --release

# Create app bundle for Google Play
flutter build appbundle --release

# Output locations:
# APK: build/app/outputs/flutter-apk/app-release.apk
# AAB: build/app/outputs/bundle/release/app-release.aab
```

### iOS Build

#### Development Build
```bash
# Build for iOS simulator
flutter run -d "iPhone 15"

# Build IPA for device
flutter build ios --debug
```

#### Release Build
```bash
# Build for App Store
flutter build ios --release

# Output: build/ios/iphoneos/Runner.app
```

---

## Testing

### Unit Tests

```bash
# Run all unit tests
flutter test

# Run specific test file
flutter test test/services/auth_service_test.dart

# Run with coverage
flutter test --coverage
```

### Integration Tests (E2E)

```bash
# Run integration tests on Android
flutter test integration_test/app_test.dart -d android

# Run integration tests on iOS
flutter test integration_test/app_test.dart -d ios

# Run integration tests on web (if enabled)
flutter test integration_test/app_test.dart -d chrome
```

### E2E Test Coverage

The `integration_test/app_test.dart` suite covers:

1. **Authentication Flow**
   - Login screen rendering
   - Sign up toggle
   - Input validation
   - Error handling

2. **Dashboard Navigation**
   - Bottom navigation bar functionality
   - Tab switching
   - Screen state persistence

3. **Vocabulary Practice**
   - Word list loading
   - Filtering (all/learned/unlearned)
   - Navigation between words
   - Definition reveal
   - Progress tracking

4. **Live Classes**
   - Class listing
   - Scheduled vs live classes
   - Real-time updates
   - Participant count

5. **User Profile**
   - Profile information display
   - Settings, help, about screens
   - Logout functionality

6. **Offline Functionality**
   - Cached data usage
   - Sync queue operations
   - Offline data persistence

7. **Responsive Design**
   - Phone layout (320-430px)
   - Tablet layout (600+px)
   - Orientation changes

8. **Theme Support**
   - Light/dark mode switching
   - System theme following

---

## Continuous Integration / Continuous Deployment

### GitHub Actions Workflow

The project includes a Flutter CI/CD pipeline that:

1. **Lint & Format Check**
   ```bash
   flutter analyze
   flutter format --set-exit-if-changed .
   ```

2. **Test Execution**
   ```bash
   flutter test
   flutter test integration_test/
   ```

3. **Build Artifacts**
   - Android APK/AAB
   - iOS IPA
   - Web build (if enabled)

### Firebase Setup for CI/CD

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Configure authentication methods (Email/Password)
3. Create Firestore database
4. Enable Firebase Storage
5. Download `GoogleService-Info.plist` (iOS) and `google-services.json` (Android)
6. Place files in appropriate directories:
   - Android: `android/app/google-services.json`
   - iOS: `ios/Runner/GoogleService-Info.plist`

---

## Architecture Overview

### Authentication Flow
```
LoginScreen → AuthService.signIn/signUp() → Firebase Auth 
  ↓
AuthWrapper checks auth state
  ↓
DashboardScreen (if authenticated) / LoginScreen (if not)
```

### State Management
- **Provider Pattern** for global state (AuthService)
- **StatefulWidget** for local screen state
- **StreamBuilder** for real-time Firebase streams

### Offline-First Approach
```
LocalCacheService (IndexedDB/SharedPreferences)
    ↓
    ├─ getCachedVocabularyWords()
    ├─ getCachedUpcomingClasses()
    ├─ getReadingProgress()
    └─ SyncQueue for pending operations
    
RealtimeSyncService
    ↓
    └─ Syncs queued operations when online
```

### Data Models
All models support serialization:
- `EbookModel` - E-book metadata
- `EbookPageContent` - Cached page content
- `VocabularyWord` - Vocabulary with practice tracking
- `LiveClass` - Class scheduling and metadata
- `ReadingSession` - Reading progress tracking
- `SyncQueueItem` - Offline operation queue

---

## Deployment Checklist

### Pre-Release
- [ ] All tests passing locally
- [ ] Code analyzed and formatted
- [ ] Firebase credentials configured
- [ ] Version bumped in `pubspec.yaml`
- [ ] App icons and splash screens finalized
- [ ] Privacy policy and terms updated

### Android Release
- [ ] Generate signing key
- [ ] Build signed APK/AAB
- [ ] Test on real device
- [ ] Submit to Google Play Store

### iOS Release
- [ ] Configure code signing
- [ ] Create provisioning profiles
- [ ] Build and archive IPA
- [ ] Submit to TestFlight/App Store

### Post-Release
- [ ] Monitor crash logs (Firebase Crashlytics)
- [ ] Track analytics (Firebase Analytics)
- [ ] Respond to user reviews
- [ ] Plan next release cycle

---

## Common Issues & Troubleshooting

### Build Issues

**Issue:** `The Android SDK is not found at $ANDROID_SDK_ROOT`
```bash
# Solution: Set Android SDK path
export ANDROID_SDK_ROOT=~/Android/sdk
flutter doctor
```

**Issue:** `Gradle build failed`
```bash
# Solution: Clean and rebuild
flutter clean
flutter pub get
flutter build apk
```

### Firebase Configuration

**Issue:** `GoogleService-Info.plist not found (iOS)`
```
Solution: Download from Firebase Console → Project Settings → iOS app
Place in ios/Runner/ directory
```

**Issue:** `google-services.json not found (Android)`
```
Solution: Download from Firebase Console → Project Settings → Android app
Place in android/app/ directory
```

### Test Issues

**Issue:** `Integration tests fail with "Firebase not initialized"`
```dart
// Solution: Initialize Firebase in test setup
IntegrationTestWidgetsFlutterBinding.ensureInitialized();
await Firebase.initializeApp(
  options: DefaultFirebaseOptions.currentPlatform,
);
```

---

## Performance Optimization

1. **Image Caching**
   - Use `cachedNetworkImage` for remote images
   - Compress images before upload

2. **Database Queries**
   - Index frequently queried fields
   - Pagination for large lists
   - Local caching with `LocalCacheService`

3. **App Size**
   - Enable code obfuscation for release builds
   - Remove unused dependencies
   - Use dynamic feature modules for large features

4. **Memory Management**
   - Dispose controllers and streams properly
   - Use `const` constructors
   - Avoid keeping large data in memory

---

## Version Management

Current version: **1.0.0+1**

Format: `MAJOR.MINOR.PATCH+BUILD_NUMBER`

- **MAJOR:** Breaking changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes
- **BUILD_NUMBER:** iOS TestFlight/Android Play Store incremental build

Update in `pubspec.yaml`:
```yaml
version: 1.0.1+2  # Version 1.0.1, build number 2
```

---

## Resources

- [Flutter Documentation](https://flutter.dev/docs)
- [Firebase for Flutter](https://firebase.flutter.dev/)
- [Provider Documentation](https://pub.dev/packages/provider)
- [Firebase Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Flutter Performance Guide](https://flutter.dev/docs/perf)

---

## Support & Contributing

For issues or contributions:
1. Check existing issues
2. Create detailed bug reports
3. Follow code style guidelines
4. Write tests for new features
5. Create pull requests with clear descriptions

---

**Last Updated:** September 21, 2026
**Status:** Production Ready ✅
