# 📄 APP FLOW DOCUMENTATION  
## Product: NutriVision Analytics

---

## 🧭 App Description

NutriVision Analytics is an AI-powered web application that allows users to upload food images and instantly receive nutritional analysis, track history, and view personalized health insights.

---

# 1. Entry Points

Users can enter the app via:

- 🌐 Direct URL (Home/Dashboard)
- 🔗 Shared result link (future P1)
- 📱 Bookmark / returning session
- 🔄 Redirect after login (if auth enabled later)

---

# 2. Core User Flows

## 🔐 Flow 1: Onboarding / First-Time Usage (No Auth MVP)

### ✅ Happy Path
1. Dashboard loads → Shows upload box  
2. User uploads image → Validation → Loading  
3. System processes image → Redirect to Results  
4. Results displayed  

### ❌ Error States
- Unsupported format → "Unsupported file format. Please upload JPG, PNG, or JPEG."
- File too large → "File size exceeds 10MB limit."
- Upload failure → "Upload failed. Please try again."

### ⚠️ Edge Cases
- Refresh during upload → cancel request  
- Back navigation → return to dashboard  

---

## 🍱 Flow 2: Food Analysis

### ✅ Happy Path
Upload → Process → Results → User interacts (export/share)

### ❌ Error States
- No food detected → "No recognizable food detected. Try another image."
- AI failure → "Analysis failed. Please retry."

---

## 📜 Flow 3: Detection History

### ✅ Happy Path
Navigate → Fetch → Display → Interact

### ❌ Error States
- No data → "No history available yet."
- Fetch error → "Failed to load history. Retry."

---

## 📊 Flow 4: Health Insights

### ✅ Happy Path
Navigate → Load → Show charts + alerts

### ❌ Error States
- Insufficient data → "Not enough data to generate insights."

---

## 👤 Flow 5: Profile

### ✅ Happy Path
Edit → Save → Persist

### ❌ Error States
- Missing fields → "Please fill all required fields."
- Invalid input → "Invalid value entered."

---

# 3. Navigation Map

Dashboard  
├── Upload  
├── Recent Analysis  

Results  
├── Overview  
├── Detailed Nutrition  

History  
├── Search  
├── Filters  

Insights  
├── Charts  
├── Alerts  

Profile  
├── Personal Info  
├── Preferences  

---

# 4. Screen Inventory

Dashboard (/)
- Upload → Results

Results (/results)
- View analysis → Export/Share

History (/history)
- View past meals

Insights (/insights)
- View trends

Profile (/profile)
- Update data

---

# 5. Decision Points

- IF file invalid → reject  
- IF no data → empty state  
- IF validation fails → block save  

---

# 6. Error Handling

404 → "Page not found"  
500 → "Server error. Try again."  
Offline → "You are offline."  

---

# 7. Responsive Behavior

Mobile → single column, stacked UI  
Desktop → multi-column, side panels  

---

# ✅ Summary

Clear flows for upload → analysis → tracking → insights.
