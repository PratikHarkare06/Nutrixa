# NutriVision AI 🍏✨

NutriVision is an intelligent, Gamified Health & Nutrition platform powered by Google's Gemini AI. It goes beyond simple calorie counting by acting as your personal AI nutritionist, personal trainer, and culinary assistant—all wrapped in a beautifully designed, installable Progressive Web App (PWA).

## 🚀 Features

- **📸 AI Food Recognition:** Snap a photo of your meal. Our AI (powered by Gemini & FatSecret) instantly recognizes the food, calculates the exact macronutrients, and logs it to your daily dashboard.
- **📅 Smart Diet Planner:** Generates a highly personalized, day-by-day, 7-day meal plan tailored perfectly to your weight, height, age, activity level, and dietary restrictions (e.g., Vegan, Gluten-Free).
- **🛒 Grocery List Generator:** Automatically extracts all necessary ingredients from your active 7-Day Diet Plan and categorizes them by supermarket aisles (Produce, Meat, Dairy, etc.) into an interactive, exportable shopping list.
- **🏋️‍♂️ AI Workout Planner:** An AI Personal Trainer that crafts a bespoke 7-day fitness routine aligned with your primary goal (Weight Loss, Muscle Gain), complete with exact exercises, sets, reps, and rest times.
- **👨‍🍳 Pantry AI Chef:** Don't know what to cook? Take a picture of your open fridge or pantry. The AI will identify your available ingredients and suggest 3 healthy, macro-friendly recipes you can make right now.
- **💧 Hydration Tracker:** An interactive daily water intake widget to keep you hydrated.
- **📉 Body Transformation Tracker:** Log your weight and upload progress photos. Watch your body transform over time on a dynamic line chart mapped against your nutritional adherence.
- **🏆 Gamification & RPG Leveling:** Earn XP by logging meals, drinking water, and hitting your daily goals. Level up and unlock exclusive golden badges (e.g., *Hydration Hero*, *First Meal Logged*) displayed proudly on your Dashboard.
- **📱 PWA Ready:** Install NutriVision directly to your iOS or Android home screen for a seamless, lightning-fast native app experience with offline caching.

---

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Data Visualization:** Recharts
- **PWA:** vite-plugin-pwa

### Backend (Server)
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **AI Integrations:** Google GenAI SDK (Gemini 2.5 Flash), FatSecret API
- **File Uploads:** Multer

---

## 💻 Running Locally

### Prerequisites
- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas URI
- API Keys for Google Gemini and FatSecret

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/PratikHarkare06/Nutri-Vision.git
cd Nutri-Vision
\`\`\`

### 2. Backend Setup
\`\`\`bash
cd backend
npm install
\`\`\`
Create a \`.env\` file in the `backend` directory:
\`\`\`env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/nutrivision
GEMINI_API_KEY=your_gemini_api_key_here
FATSECRET_CLIENT_ID=your_fatsecret_client_id_here
FATSECRET_CLIENT_SECRET=your_fatsecret_client_secret_here
APP_URL=http://localhost:5001
\`\`\`
Start the backend server:
\`\`\`bash
npm run dev
\`\`\`

### 3. Frontend Setup
Open a new terminal window:
\`\`\`bash
cd frontend
npm install
\`\`\`
Start the Vite development server:
\`\`\`bash
npm run dev
\`\`\`

Open your browser to `http://localhost:5173` and start tracking!

---

## 📱 Installing as a Mobile App
Because NutriVision is a Progressive Web App (PWA):
- **iOS (Safari):** Tap the Share button, then scroll down and tap "Add to Home Screen".
- **Android (Chrome):** Tap the 3-dot menu and select "Install app" or "Add to Home screen".

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License
This project is licensed under the MIT License.
