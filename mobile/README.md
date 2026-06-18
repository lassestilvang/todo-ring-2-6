# TaskPlanner Mobile App

A React Native mobile application for TaskPlanner with offline support and push notifications.

## Quick Start

```bash
# Install dependencies
npm install

# Run on Android
npx react-native run-android

# Run on iOS
npx react-native run-ios

# Run tests
npm test
```

## Features

- 📱 Offline support with local caching
- 🔔 Push notifications for reminders
- 🔄 Real-time sync with WebSocket
- 📋 Task management (create, edit, delete)
- ✅ Subtask support
- 🏷️ Labels and priorities
- 📅 Calendar integration
- 🎯 Focus mode

## Project Structure

```
mobile/
├── App.js              # Main app entry
├── components/         # Reusable components
├── screens/            # Screen components
├── navigation/         # Navigation setup
├── context/            # React context providers
├── assets/             # Images, fonts, etc.
└── package.json        # Dependencies
```

## Dependencies

- react-native
- @react-navigation/native
- @react-navigation/native-stack
- react-native-paper
- @react-native-async-storage/async-storage
- react-native-push-notification

## API Integration

The mobile app connects to the TaskPlanner API at:
- `NEXT_PUBLIC_API_URL` - API base URL
- `NEXT_PUBLIC_WS_URL` - WebSocket URL

## Offline Support

Tasks are cached locally using AsyncStorage and synced when online.

## Push Notifications

Configure push notifications in `android/app/src/main/AndroidManifest.xml` and `ios/TaskPlanner/Info.plist`.

## Development

```bash
# Start metro
npx metro start

# Run tests
npm test

# Build for release
cd android && ./gradlew assembleRelease
```