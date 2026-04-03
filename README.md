# BunkMate

**BunkMate** is a React Native mobile app that helps students track their attendance, monitor academic progress, and manage coursework — all in one place.

> "Track your attendance and stay above 75%"

---

## Features

- **Attendance Tracking** — Real-time sync from your institution's backend, with manual override and conflict resolution
- **Dashboard** — At-a-glance overview of all subjects with attendance percentages and status indicators (safe / warning / danger)
- **Subject Details** — Per-subject attendance breakdown with a calendar view and daily schedule
- **Assignments & Exams** — View assignments, answer questions, and track scores
- **Student Surveys** — Complete and submit institutional feedback surveys
- **Notifications** — Real-time alerts and academic updates
- **Absentee Report** — Historical attendance analytics and reports
- **Public Forum** — Community chat for students
- **Authentication** — Two-step login (username lookup → password) with a built-in password reset flow
- **Settings** — Academic year / semester selector and theme toggle
- **Dark & Light Mode** — Automatic or manual theme switching
- **OTA Updates** — Over-the-air updates via Expo Updates
- **Offline-first** — Local SQLite database caches attendance and course data

---

## Tech Stack

| Layer | Libraries |
|---|---|
| Framework | React Native 0.81.4, Expo 54, TypeScript 5 |
| Navigation | React Navigation (native-stack, bottom-tabs) |
| State | Zustand 5 |
| HTTP | Axios 1.10 |
| Database | expo-sqlite + Drizzle ORM |
| Animations | react-native-reanimated 4, expo-linear-gradient, expo-blur |
| Icons | @expo/vector-icons (Ionicons) |
| Date utils | date-fns 4 |
| Builds | EAS (Expo Application Services) |

---

## Project Structure

```
BunkMate/
├── App.tsx                  # Root component — initialization, auth check, theme setup
├── app.json                 # Expo configuration
├── eas.json                 # EAS build profiles
├── src/
│   ├── api/                 # HTTP services (auth, attendance, assignments, surveys, …)
│   ├── components/          # Reusable UI components
│   ├── constants/           # API config, color palette, thresholds
│   ├── db/                  # SQLite database setup (Drizzle)
│   ├── hooks/               # Custom React hooks
│   ├── kv/                  # Key-value local storage helper
│   ├── navigation/          # RootNavigator and TabNavigator
│   ├── screens/             # App screens
│   │   ├── Dashboard/       # Attendance overview
│   │   ├── Login/           # Auth flow
│   │   ├── SubjectDetails/  # Per-subject detail & calendar
│   │   ├── Assignments/     # Exams / assignment viewer
│   │   ├── Surveys/         # Student feedback surveys
│   │   ├── Notifications/   # Alerts
│   │   ├── AbsenteeReport/  # Analytics & reports
│   │   ├── PublicForum/     # Community chat
│   │   └── Settings/        # Preferences
│   ├── state/               # Zustand stores (auth, attendance, theme, …)
│   ├── types/               # TypeScript interfaces
│   └── utils/               # Helper functions
└── assets/                  # Icons, splash screens, favicon
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- Android emulator / iOS simulator **or** the [Expo Go](https://expo.dev/client) app on your device

### Installation

```bash
git clone https://github.com/kichu12348/BunkMate.git
cd BunkMate
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
EXPO_PUBLIC_API_URL=https://your-institution-api.example.com
EXPO_PUBLIC_INSIGHTS_URL=https://your-insights-endpoint.example.com
```

### Running the App

```bash
# Start the Expo development server
npm start

# Or target a specific platform directly
npm run android
npm run ios
```

---

## Building for Production

BunkMate uses [EAS Build](https://docs.expo.dev/build/introduction/) for native builds.

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for Android (APK)
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

Build profiles (`eas.json`):

| Profile | Distribution | Channel |
|---|---|---|
| `development` | Internal | development |
| `preview` | Internal | preview |
| `production` | Store / APK | production |

---

## Attendance Thresholds

| Status | Attendance |
|---|---|
| 🟢 Safe | ≥ 85 % |
| 🟡 Warning | 75 – 84 % |
| 🔴 Danger | < 75 % |

---

## License

This project is maintained by [@kichu12348](https://github.com/kichu12348).
