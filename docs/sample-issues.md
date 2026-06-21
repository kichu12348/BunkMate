# Sample Issues for Contribution Event 🚀

This document lists the sample issues that can be imported to the Bunkmate GitHub repository to kickstart the event.

---

## 🟢 Level: Beginner
*Target: First PR, documentation, or basic folder setup.*

1. **Title**: [Beginner] Add local setup instructions to README
   **Description**: Currently, the `README.md` doesn't explain how new contributors can get the Bunkmate Expo app running on their local machines. We need a clear "Quick Start" guide so beginners don't have to guess how to start the development server or test their changes.
   **Labels**: `beginner`, `documentation`, `good first issue`

---

## 🔵 Level: Easy
*Target: Basic algorithms, simple UI styling, or single-file scripts.*

2. **Title**: [Easy] Add empty state illustrations for Duty Leave and Assignments
   **Description**: When a user opens the app and navigates to the Duty Leave or Assignments screens, the lists are completely blank if no data exists. Create a reusable `<EmptyState/>` component with a friendly illustration to guide the user on what to do next.
   **Labels**: `easy`, `frontend`, `enhancement`

---

## 🟡 Level: Medium
*Target: Multi-file logic, API integration, or complex data structures.*

3. **Title**: [Medium] Fix screen freezing when editing attendance in modal
   **Description**: When a user opens the Attendance Day modal to edit their attendance status, submitting the change causes the screen to get completely stuck. The overlay remains active but unresponsive, requiring a full app restart. Fix the state logic or modal visibility prop to resolve this freeze.
   **Labels**: `medium`, `bug`, `frontend`

4. **Title**: [Medium] Add loading skeleton to OverallStatsCard
   **Description**: Currently, when the Dashboard loads, the attendance stats in the `OverallStatsCard` pop in abruptly once the data finishes fetching. Add a shimmer/loading skeleton state to render as a placeholder while the attendance data is loading in the background.
   **Labels**: `medium`, `frontend`, `enhancement`

---

## 🔴 Level: Hard
*Target: Complex systems, optimization, or integration of multiple technologies.*

5. **Title**: [Hard] Audit and eliminate dead code across the src/ directory
   **Description**: Use a tool like `ts-prune` or `knip` to automatically detect unused TypeScript exports. Safely remove orphaned UI components, outdated API queries, and unused import statements without breaking the existing Expo build.
   **Labels**: `hard`, `enhancement`, `help wanted`