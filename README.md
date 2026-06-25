# BunkMate 🎓

> A modern attendance companion for students built with React Native and Expo.

BunkMate helps students stay on top of their attendance requirements, manage academic activities, complete surveys, and access university-related information from a single application. It was designed to make maintaining the minimum attendance requirement simple while providing additional tools that students actually use every day.

## ✨ Features

### 📊 Attendance Tracking

- View detailed attendance statistics for each subject.
- Calculate how many classes you can safely miss.
- Find out how many classes you need to attend to maintain eligibility.
- Project future attendance percentages.

### ⚖️ Conflict Resolution

- Resolve discrepancies between professor-marked attendance and manually tracked attendance.
- Merge local attendance records with server-provided data.

### 👥 Multi-Account Support

- Save multiple student profiles.
- Quickly switch between accounts without repeated authentication.

### 🎓 KTU Grade Card Integration(Beta)

- Fetch university grade cards through scraper integration.
- Cache results locally for faster access.

### 📝 Assignments & Exams

- Browse assignments and academic updates.
- Access detailed question-and-answer views.

### 🏷️ Duty Leave Management

- Add and track duty leaves.
- Include duty leaves in attendance projections.

### 💬 Public Forum

- Real-time chat experience powered by WebSockets.
- Tenor GIF integration for richer conversations.

### 🔔 Notifications & Surveys

- Receive important updates.
- Participate in surveys directly within the app.

### 🎨 Theme Support

- Full Dark Mode and Light Mode support.
- Smooth animated transitions across themes.

---

# 🛠 Tech Stack

## Core

- **Framework:** React Native with Expo
- **Expo SDK:** 54.x
- **Language:** TypeScript

## Navigation

- React Navigation v7
  - Native Stack Navigator
  - Bottom Tab Navigator

## State Management

- Zustand

## Networking

- Axios
- Axios Interceptors
- WebSockets

## Database & Storage

- Expo SQLite
- `expo-sqlite/kv-store`
- Drizzle ORM

## UI & Animations

- React Native Reanimated
- Expo Blur
- React Native Gesture Handler

## Icons

- `@expo/vector-icons`

---

# 📁 Project Structure

The codebase is organized to keep business logic isolated and easy to navigate.

```text
src/
├── api/
├── assets/
├── components/
├── constants/
├── db/
├── hooks/
├── kv/
├── navigation/
├── screens/
├── state/
├── types/
└── utils/
```

## `src/api`

Service classes responsible for interacting with backend services.

Examples include:

- Authentication
- Attendance
- Assignments
- Chat
- Surveys
- Notifications

All API communication is centralized here using Axios instances and interceptors.

---

## `src/components`

Reusable UI components used throughout the application.

### Modals

Complex overlay components such as:

- Attendance editing
- Password reset
- Update alerts

### UI Components

Reusable primitives including:

- Text
- Switch
- Slider
- Dropdowns
- Refresh loaders
- Custom tab bar components

---

## `src/constants`

Application-wide constants and configuration.

Includes:

- Theme color definitions
- Configuration values
- API endpoints
- Thresholds and defaults

---

## `src/db`

SQLite database setup and database helpers.

Responsible for:

- Database initialization
- Cached relational data
- Account persistence
- Grade card caching

Notable databases include:

- `accountsDb`
- `KtuScrapDb`
- `bunkmate_cache.db`

---

## `src/hooks`

Custom React hooks.

Examples:

- `useTheme`
- Other reusable application hooks

---

## `src/kv`

Key-value storage abstraction built on top of Expo SQLite KV Store.

Used for:

- Access tokens
- Theme preferences
- Lightweight settings
- Cached URIs

---

## `src/navigation`

Application navigation setup.

Contains:

- Root navigator
- Tab navigator
- Navigation configuration

---

## `src/screens`

The primary screens of the application.

Examples include:

- Dashboard
- Login
- Settings
- Notifications
- Surveys
- Assignments
- Duty Leave
- KTU Grade Card
- Public Forum

---

## `src/state`

Global state powered by Zustand.

Stores are split by responsibility.

Examples include:

- Authentication
- Attendance
- Theme
- Accounts
- Assignments
- KTU grades

---

## `src/types`

TypeScript definitions.

Contains:

- API response types
- Component props
- Shared interfaces
- Domain models

---

## `src/utils`

Utility functions and helpers.

Examples:

- Attendance calculations
- HTML parsing
- Filesystem utilities
- WebSocket helpers
- Date and formatting helpers

---

# 🧠 State Management

BunkMate uses Zustand to maintain a modular and scalable state architecture.

Some important stores include:

## Attendance Store

Responsible for:

- Fetching attendance
- Merging server and local data
- Handling attendance conflicts
- Caching attendance information

## Authentication Store

Handles:

- Login flows
- Authentication state
- Token management

## Theme Store

Controls:

- Theme selection
- Light/Dark mode switching

## KTU Grades Store

Manages:

- Scraper state
- Session cookies
- Cached grade cards

## Accounts Store

Handles:

- Saved accounts
- Multi-account switching

---

# 💾 Local Storage Strategy

BunkMate uses a hybrid persistence approach.

## KV Store

Used for lightweight data:

- JWT tokens
- Preferences
- Theme settings
- Miscellaneous user settings

---

## SQLite Database

Used for structured data:

- Student accounts
- Cached grade cards
- Application cache

Database file:

```text
bunkmate_cache.db
```

---

# 🚀 Getting Started

## ⚡ Quick Start (TL;DR)

```bash
git clone https://github.com/kichu12348/BunkMate.git
cd BunkMate
npm install
# create .env file with required variables (see Configuration below)
npx expo start
```

Scan the QR code with **Expo Go** ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) · [iOS](https://apps.apple.com/app/expo-go/id982107779)) to preview instantly on your phone.

---

### Prerequisites

Before running the project, ensure you have:

- **Node.js** v18 or higher — [Download](https://nodejs.org)
- **npm** or **Yarn** — comes with Node.js
- **Expo CLI** — install with `npm install -g expo-cli`
- **EAS CLI** — install with `npm install -g eas-cli`
- One of the following to run the app:
  - **Expo Go** app on your Android or iOS phone *(easiest for beginners)*
  - Android Emulator via Android Studio
  - iOS Simulator via Xcode *(macOS only)*

> 💡 **Tip for beginners:** Expo Go is the fastest way to preview changes. Just install it on your phone and scan the QR code after running `npx expo start`.

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/kichu12348/BunkMate.git
cd BunkMate
```

---

### 2. Install Dependencies

```bash
npm install
```

or

```bash
yarn install
```

---

### 3. Configure Environment Variables

Create a `.env` file in the project root.

```bash
cp .env.example .env   # if example exists, otherwise create manually
```

Fill in the following variables:

```env
EXPO_PUBLIC_API_URL=your_api_url_here
EXPO_PUBLIC_INSIGHTS_URL=your_insights_url_here
EXPO_PUBLIC_KTU_SCRAPER_BASE_URL=your_ktu_scraper_url_here
EXPO_PUBLIC_TENOR_API_KEY=your_tenor_api_key
EXPO_PUBLIC_TENOR_API_URL=https://g.tenor.com/v1
EXPO_PUBLIC_GITHUB_URL=your_repository_url
EXPO_PUBLIC_OVERVIEW_URL=your_website_url
```

Refer to the configuration files for any additional variables required during development.

> ⚠️ **Note:** The app requires a running backend for full functionality. For UI-only contributions (styling, components, screens), the app will still launch without all variables filled in. Comment on the issue you're working on to ask for development API URLs.

---

### 4. Start the Development Server

```bash
npx expo start
```

---

### 5. Run the Application

#### Android

Press:

```text
a
```

to launch the Android emulator.

---

#### iOS

Press:

```text
i
```

to launch the iOS simulator.

---

## 🛠️ Troubleshooting

### Metro bundler not starting?
```bash
npx expo start --clear
```

### Dependencies not installing?
```bash
rm -rf node_modules
npm install
```

### Expo Go showing version mismatch?
Make sure your Expo Go app is updated to the latest version. The project uses **Expo SDK 54.x**.

### Environment variable not loading?
Ensure your `.env` file is in the **project root** (same level as `package.json`) and all variable names start with `EXPO_PUBLIC_`.

### Android emulator not detected?
Make sure Android Studio is open and the emulator is running before pressing `a` in the Expo terminal.

#### Physical Device

Scan the QR code using:

- Expo Go (Android)
- Camera App / Expo Go (iOS)

---

# 🤝 Contributing

Contributions are always welcome. Please refer to our [CONTRIBUTION.md](CONTRIBUTION.md) for detailed guidelines.

## Before You Start

- Check existing issues before creating a new one.
- Discuss major changes through an issue first.

---

## Development Guidelines

### Branch Naming

Create feature branches using descriptive names.

Example:

```bash
git checkout -b feature/improve-attendance-conflicts
```

---

### Styling

- Use theme-aware styling utilities.
- Prefer `useTheme` and themed styles.
- Avoid hardcoded colors.
- Keep Light and Dark mode compatibility in mind.

---

### API Usage

- Use service classes from `src/api`.
- Avoid raw `fetch` calls unless necessary.
- Reuse configured Axios instances and interceptors.

---

### State Management

- Extend existing Zustand stores where appropriate.
- Keep stores focused on a single responsibility.

---

### Commits

Write meaningful commit messages.

Examples:

```text
feat: add attendance projection improvements
fix: resolve duty leave calculation bug
refactor: simplify account switching logic
```

---

### Pull Requests

When opening a PR:

- Clearly explain the problem being solved.
- Include screenshots for UI changes.
- Reference related issues.
- Ensure the app builds successfully.

---

# 📌 Version
- 2.0.1

Refer to release notes and tags for the most up-to-date version history.

---

# 👨‍💻 Author

**Mahadevan Reji**

GitHub: https://github.com/kichu12348

---

## ❤️ Acknowledgements

BunkMate exists to make student life a little less stressful by helping students focus less on attendance calculations and more on what actually matters.

If you're contributing, thank you for helping improve the experience for students.

---

Made with ❤️ by Kichu.
