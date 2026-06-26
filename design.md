# Application Design & Component Structure

This document outlines the structure of the application's pages and components to assist in the redesign process.

## 🧭 Pages (Views/Routes)
Located in `frontend/src/pages/`

### 1. Dashboard Page (`/`)
- **File**: `DashboardPage.tsx`
- **Purpose**: The main landing page after opening the app. Typically features the main calls-to-action (e.g., uploading an image), quick stats, and navigation to other core areas.

### 2. Results Page (`/results`)
- **File**: `ResultsPage.tsx`
- **Purpose**: Displays the outcome of a processed image upload (e.g., nutritional analysis, recognized food items).

### 3. Insights Page (`/insights`)
- **File**: `InsightsPage.tsx`
- **Purpose**: Shows analytics, nutrition trends, and broader dietary patterns over time.

### 4. Diet Plan Page (`/diet-plan`)
- **File**: `DietPlanPage.tsx`
- **Purpose**: Shows personalized diet plans, meal suggestions, and daily nutritional goals.

### 5. Pantry Page (`/pantry`)
- **File**: `PantryPage.tsx`
- **Purpose**: Manages available ingredients and helps generate recipes based on what's currently in the pantry.

### 6. Workout Page (`/workouts`)
- **File**: `WorkoutPage.tsx`
- **Purpose**: Displays workout plans, exercise logs, and fitness tracking functionalities.

### 7. History Page (`/history`)
- **File**: `HistoryPage.tsx`
- **Purpose**: Displays past food uploads, previous meal logs, and historical data.

### 8. Profile Page (`/profile`)
- **File**: `ProfilePage.tsx`
- **Purpose**: User settings, personal information, dietary preferences, and account management.

---

## 🧩 Shared Components
Located in `frontend/src/components/`

### 1. App Header
- **File**: `AppHeader.tsx`
- **Purpose**: Global top navigation bar used across all pages. Contains links to routing paths and user profile shortcuts.

### 2. Upload Card
- **File**: `UploadCard.tsx`
- **Purpose**: A reusable card component to handle file drops/uploads. Used prominently on the Dashboard.

### 3. Progress Tracker
- **File**: `ProgressTracker.tsx`
- **Purpose**: Visual indicator for goals (e.g., daily calories, macronutrient targets).

### 4. Hydration Widget
- **File**: `HydrationWidget.tsx`
- **Purpose**: Widget for tracking and displaying daily water intake.

### 5. Gamification Widget
- **File**: `GamificationWidget.tsx`
- **Purpose**: Displays user streaks, badges, points, or XP earned through engagement.

### 6. Grocery List Modal
- **File**: `GroceryListModal.tsx`
- **Purpose**: Modal overlay for managing and generating shopping lists from the pantry or diet plans.

### 7. Icons
- **File**: `icons.tsx`
- **Purpose**: Centralized library of SVG icons used throughout the interface.

---

## 🎨 Global Styling
- **Entry File**: `index.css`
- **Configuration**: `tailwind.config.js`
- **Strategy**: Utility-first CSS using Tailwind CSS. Global base styles, typography, and theme tokens are defined here.
