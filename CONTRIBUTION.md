# Contributing to BunkMate 🤝

First of all, thank you for taking the time to contribute to BunkMate! Every contribution—whether it's fixing a bug, improving documentation, refining the UI, or implementing a new feature—helps make the project better for everyone.

This guide outlines the conventions and expectations for contributing to the project.

---

# Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Before You Start](#before-you-start)
- [Development Setup](#development-setup)
- [Branching Strategy](#branching-strategy)
- [Coding Guidelines](#coding-guidelines)
- [State Management Guidelines](#state-management-guidelines)
- [API Guidelines](#api-guidelines)
- [UI and Theming Guidelines](#ui-and-theming-guidelines)
- [Database and Storage Guidelines](#database-and-storage-guidelines)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Testing Checklist](#testing-checklist)

---

# Code of Conduct

Please be respectful and constructive when interacting with other contributors.

We aim to maintain a welcoming environment where people can collaborate, learn, and build together regardless of experience level.

---

# Ways to Contribute

You don't have to implement major features to make a meaningful contribution.

You can help by:

- Fixing bugs.
- Improving documentation.
- Refactoring existing code.
- Enhancing accessibility.
- Improving performance.
- Adding tests.
- Reporting reproducible issues.
- Reviewing pull requests.
- Suggesting new ideas and improvements.

---

# Before You Start

Before working on a contribution:

## For Bug Fixes

- Search existing issues first.
- Confirm the issue still exists.
- Include reproduction steps when opening an issue.

## For Features

Please open an issue before beginning large features.

This helps ensure that:

- The feature aligns with the project's goals.
- Duplicate work is avoided.
- The implementation approach can be discussed beforehand.

---

# Development Setup

## Prerequisites

Make sure you have the following installed:

- Node.js (v18 or newer recommended)
- npm or Yarn
- Expo CLI
- EAS CLI
- Android Studio or Xcode (optional)
- Expo Go

Install EAS CLI:

```bash
npm install -g eas-cli
```

---

## Clone the Repository

```bash
git clone https://github.com/kichu12348/BunkMate.git
cd BunkMate
```

---

## Install Dependencies

```bash
npm install
```

or

```bash
yarn install
```

---

## Configure Environment Variables

Create a `.env` file in the project root.

```env
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_INSIGHTS_URL=
EXPO_PUBLIC_KTU_SCRAPER_BASE_URL=
EXPO_PUBLIC_TENOR_API_KEY=
EXPO_PUBLIC_TENOR_API_URL=
EXPO_PUBLIC_GITHUB_URL=
EXPO_PUBLIC_OVERVIEW_URL=
```

Ask a maintainer if additional development variables are required.

---

## Start the Development Server

```bash
npx expo start
```

---

# Branching Strategy

Never work directly on the `main` branch.

Create a dedicated branch for every change.

## Naming Conventions

### Features

```text
feature/short-description
```

Example:

```text
feature/improve-duty-leave-calculation
```

---

### Bug Fixes

```text
fix/short-description
```

Example:

```text
fix/chat-reconnection-issue
```

---

### Documentation

```text
docs/short-description
```

Example:

```text
docs/update-readme
```

---

### Refactoring

```text
refactor/short-description
```

Example:

```text
refactor/attendance-store
```

---

# Coding Guidelines

## TypeScript

- Prefer explicit types over `any`.
- Reuse existing types whenever possible.
- Add new shared interfaces to `src/types`.
- Keep functions focused and small.

### Avoid

```ts
const data: any = response;
```

### Prefer

```ts
const data: AttendanceResponse = response;
```

---

## Naming

### Variables and Functions

Use descriptive camelCase names.

```ts
calculateProjectedAttendance()
fetchAssignments()
```

---

### Components

Use PascalCase.

```tsx
AttendanceCard
UpdateModal
ThemeSwitch
```

---

### Files

Match filenames to exported components or responsibilities.

```text
AttendanceCard.tsx
themeStore.ts
attendance.ts
```

---

# State Management Guidelines

BunkMate uses Zustand extensively.

When modifying state:

## Do

- Keep stores focused on a single responsibility.
- Reuse existing stores before creating new ones.
- Encapsulate state updates inside store actions.
- Keep side effects predictable.

## Avoid

- Duplicating global state.
- Direct mutations outside store actions.
- Creating large "god stores."

---

# API Guidelines

All backend communication should go through the API layer.

## Always

- Use the service classes inside `src/api`.
- Use existing Axios instances.
- Reuse interceptors.
- Handle failures gracefully.

## Avoid

```ts
fetch(...)
```

unless there is a clear reason that cannot be addressed through the existing API layer.

---

# UI and Theming Guidelines

BunkMate supports both Light and Dark themes.

All UI contributions should respect both.

## Do

- Use theme-aware hooks and utilities.
- Verify your UI in both themes.
- Reuse existing UI primitives.
- Follow existing spacing patterns.

## Avoid

- Hardcoded colors.
- Theme-specific hacks.
- Duplicated components.

### Bad

```tsx
backgroundColor: "#000"
```

### Better

```tsx
backgroundColor: theme.colors.background
```

---

# Database and Storage Guidelines

The app uses both SQLite and KV storage.

## KV Store

Use for:

- Preferences
- Tokens
- Lightweight values

## SQLite

Use for:

- Structured data
- Cached entities
- Relational information

Before changing database schemas:

- Consider migration requirements.
- Ensure existing users are not affected.
- Test upgrade scenarios.

---

# Commit Message Convention

Use clear and descriptive commit messages.

Format:

```text
type: short description
```

## Examples

### Features

```text
feat: add projected attendance summary
```

### Fixes

```text
fix: resolve grade card cache issue
```

### Refactoring

```text
refactor: simplify account initialization
```

### Documentation

```text
docs: update contribution guidelines
```

### Performance

```text
perf: optimize attendance calculations
```

---

# Pull Request Process

Before opening a pull request:

## Ensure That

- [ ] The project builds successfully.
- [ ] Your changes have been tested.
- [ ] Existing functionality has not regressed.
- [ ] Documentation has been updated if necessary.
- [ ] The code follows existing conventions.
- [ ] There are no obvious linting or type issues.

---

## Pull Request Description

Include:

### What Changed

Explain the changes made.

### Why

Describe the problem being solved.

### Screenshots

Attach screenshots or recordings for UI changes.

### Related Issues

Reference any related issues.

Example:

```text
Closes #42
```

---

# Issue Guidelines

When reporting bugs, please include:

## Environment

- Device
- Operating System
- App Version

## Reproduction Steps

Provide clear instructions.

Example:

1. Open Dashboard.
2. Navigate to Duty Leave.
3. Add a leave entry.
4. Observe incorrect attendance percentage.

## Expected Behavior

Describe what should happen.

## Actual Behavior

Describe what currently happens.

---

# Testing Checklist

Before submitting your contribution, verify the following:

## General

- [ ] Application launches successfully.
- [ ] No new TypeScript errors were introduced.
- [ ] Existing flows continue to work.

## Attendance

- [ ] Attendance calculations remain accurate.
- [ ] Conflict resolution still functions.

## Accounts

- [ ] Account switching works correctly.

## Themes

- [ ] UI works in Light Mode.
- [ ] UI works in Dark Mode.

## Chat

- [ ] WebSocket functionality remains stable.

## Grade Cards

- [ ] Cached grade cards load correctly.
- [ ] Scraper-related functionality is unaffected.

---

### ⚠️ Native Dependency Policy
This project relies on **Expo**. 

When adding a new package that requires native iOS/Android code:
1. **Do not manually edit the `android/` or `ios/` directories.** 2. Always use **Expo Config Plugins** in the `app.json` file to manage native permissions and configurations.
3. If you add a native dependency, standard Expo Go will no longer work for testing that feature. You must create a local Development Build using `npx expo run:android` or `npx expo run:ios`.

---

# Questions?

If you're unsure about an implementation, architecture decision, or whether a contribution aligns with the project's goals, feel free to open an issue and start a discussion before investing significant time.

We appreciate every contribution, no matter how small.

Thank you for helping make BunkMate better. ❤️