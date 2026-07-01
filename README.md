# Nutrixa AI 🍏✨

Nutrixa is an intelligent, gamified Health, Nutrition, & Sleep ecosystem. It functions as a complete self-care suite, acting as a personal nutritionist, fitness coach, sleep cycle analyst, and interactive culinary assistant in a single Progressive Web App (PWA).

---

## 🌟 Core Features

### 1. Multimodal AI Analysis & Scanning
* **Photo Food Scanner**: Analyzes meal images to estimate portions, weights, and detailed macronutrients, mapped directly to Indian and global food items.
* **Barcode Scanner**: Scans packaged product UPC barcodes to instantly identify items and pull verified nutritional statistics.
* **Receipt Scanner**: Extracts grocery listings using OCR to automatically update the user's pantry inventory.
* **Pantry / Fridge Stock Scanner**: Captures images of kitchen shelves and records available ingredients.
* **ChefVoice Assistant**: Hands-free voice commands to navigate ingredients, instructions, and timers while cooking.

### 2. Intelligent Planners
* **7-Day Custom Diet Planner**: Generates day-by-day diet programs tailored to target weight, daily activity levels, age, and dietary preferences (e.g., High Protein, Vegan, Gluten-Free). Includes an **AI Swapper Modal** to swap individual meals.
* **Aisle-Categorized Grocery List**: Automatically parses active diet plans to compile consolidated shopping lists grouped by supermarket departments.
* **AI Workout Coach**: Simulated Apple Health data synchronization to design customized fitness regimes, dynamic workouts, and rest schedules based on user targets.
* **Circadian Sleep Cycle Assistant**: Visualizes sleep quality indicators, tracks deep/light/REM sleep stages, and provides behavioral suggestions.

### 3. Gamified Dashboard & Reminders
* **XP Progression & Levels**: Users gain experience points (XP) for logged water intake, meals, and completed workouts.
* **Daily Logging Streak System**: Tracks continuous logging streaks with progress badges like *Hydration Hero* or *Calorie Champion*.
* **Streak Celebration Animations**: Visual feedback celebrations (pulsing green rings, energetic particles) upon logging.
* **Web Notification Reminders**: Native browser scheduling for logging meals (Breakfast, Lunch, Dinner, Snack) and drinking water at configurable intervals.

---

## 📂 Project Directory Structure

```
Nutrixa/
├── frontend/                     # Client application (React + TypeScript)
│   ├── src/
│   │   ├── components/           # Reusable UI elements (Charts, Uploaders, Sidebars)
│   │   ├── pages/                # Application Views (Dashboard, Workout, Sleep, Profile)
│   │   ├── services/             # Client API wrappers
│   │   ├── store/                # Zustand global states (Auth, Uploads)
│   │   ├── utils/                # Helper functions (Notifications, Image loaders)
│   │   ├── App.tsx               # Main routing & layout controller
│   │   └── main.tsx              # React mounting root
│   ├── vite.config.ts            # Vite bundler & PWA plugin configurations
│   └── tsconfig.json             # TypeScript rules
│
├── backend/                      # Server application (Node.js + Express)
│   ├── src/
│   │   ├── controllers/          # Endpoint controllers (History, Workout, Profile)
│   │   ├── models/               # MongoDB Mongoose schemas
│   │   ├── routes/               # API endpoint routers
│   │   ├── services/             # Core service workers (AI recipe, Sleep analyzer)
│   │   ├── utils/                # Server utilities (Indian food mappings, fallbacks)
│   │   └── index.js              # Express listener start script
│   └── package.json              # Server dependencies
```

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Core** | React 18 & TypeScript | Build system matching high-fidelity interfaces |
| **Styling** | Tailwind CSS | Modern layout rendering with Glassmorphic utilities |
| **Client State** | Zustand | Light state management for auth triggers & local caches |
| **Data Viz** | Recharts | Interactive sleep stage matrices & macro pie charts |
| **Service Workers** | Vite PWA Plugin | Pre-caches resources for installing app to homescreen |
| **Backend Core** | Node.js & Express | Server architecture |
| **Database** | MongoDB & Mongoose | Document modeling for user profile histories |
| **File Storage** | Multer | local disk storage handling for scanned documents |

---

## 💻 Local Setup & Deployment

### 1. Clone Project
```bash
git clone https://github.com/PratikHarkare06/Nutri-Vision.git
cd Nutri-Vision
```

### 2. Backend Setup
Navigate into the server workspace directory, install dependencies, and run:
```bash
cd backend
npm install
npm run dev
```

### 3. Frontend Setup
Open a new terminal window to build the user client application:
```bash
cd frontend
npm install
npm run dev
```
Navigate your browser to `http://localhost:5173`.

---

## 🗄️ Database Schemas & Storage Design

* **User Profile**: Houses age, weight, height, goal preferences, dietary settings, accumulated XP, leveling attributes, unlocked achievements, and daily water goals.
* **Nutrition History Logs**: Records custom meal inputs, photo-logged items, estimated portion values, and calorie totals mapped to specific dates.
* **Workout Records**: Tracks active exercise entries, calculated calories burned, and total duration minutes.
* **Sleep Logs**: Stores bedtime values, wake-up times, calculated sleep quality scores, and estimated sleep stage profiles.

---

## 📱 Progressive Web App Features

Nutrixa behaves like a native application when downloaded:
* **Standalone Execution**: Displays without traditional web browser tabs and borders.
* **Launch Icon**: Direct home screen access on iOS and Android.
* **Offline Pre-caching**: Core client scripts, assets, styles, and fonts are preserved locally using Workbox strategies.
