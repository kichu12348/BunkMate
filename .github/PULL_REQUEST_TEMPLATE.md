## Description
Please include a summary of the change and which issue is fixed. If you are modifying scraper logic or database schemas, please explain why.

Fixes # (issue)

## Type of change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature / Screen addition (non-breaking change which adds functionality)
- [ ] Refactoring (State management, hooks, or utility functions code cleanup)
- [ ] Documentation update

## How Has This Been Tested?
Please describe the tests you ran to verify your changes (e.g., tested on Expo Go Android/iOS).

## Screenshots / UI Demos (if applicable)
Please add screenshots or GIFs for any visible Frontend / UI changes.

## Checklist:
- [ ] My code follows the code style and directory structure of this project (src/components, src/state, etc.)
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in complex areas like scraper parsers or db transactions
- [ ] My changes generate no new TypeScript compiler warnings or Expo runtime errors
- [ ] I have matched the expected branch and commit naming conventions.

## 📱 Native Dependency Changes (If Applicable)
*Did you add a package that requires native code (e.g., modifying `android/` or `ios/` directories, or adding Expo config plugins)?*

- [ ] Yes
- [ ] No

**If Yes, please check the following:**
- [ ] I have added the required Expo Config Plugin to `app.json`.
- [ ] I have documented any new permissions (e.g., Camera, Storage) added to `app.json`.
- [ ] I have successfully tested this on an **Android Emulator / Device** using a custom dev build.
- [ ] I have successfully tested this on an **iOS Simulator / Device** using a custom dev build.
- [ ] I have run `npx expo prebuild --clean` to ensure the native directories generate correctly without crashing.