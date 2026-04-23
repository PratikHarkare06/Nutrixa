# 📄 TECHNOLOGY STACK DOCUMENT  
## Product: NutriVision Analytics

---

## 🧭 App Context

- **Type:** Web Application (Full Stack)
- **Scale:** MVP → Small Scale (up to 1k concurrent users)
- **Timeline:** MVP in 4–6 weeks

---

# 1. FRONTEND STACK

## ⚛️ Framework
- React — v18.2.0  
Docs: https://react.dev/

Reason: Component-based, scalable UI

---

## ⚡ Build Tool
- Vite — v5.0.10  
Docs: https://vitejs.dev/

Reason: Fast dev server and builds

---

## 🟦 TypeScript
- TypeScript — v5.3.3  
Docs: https://www.typescriptlang.org/

Reason: Type safety

---

## 🎨 Styling
- Tailwind CSS — v3.4.1  
Docs: https://tailwindcss.com/

Reason: Rapid UI development

---

## 🧠 State Management
- Zustand — v4.5.2  
Docs: https://zustand-demo.pmnd.rs/

Reason: Lightweight and simple

---

## 📡 HTTP Client
- Axios — v1.6.7  
Docs: https://axios-http.com/

---

## 🧾 Forms
- React Hook Form — v7.49.3  
Docs: https://react-hook-form.com/

---

## 📊 Charts
- Recharts — v2.8.0  
Docs: https://recharts.org/

---

# 2. BACKEND STACK

## 🟢 Runtime
- Node.js — v20.11.1  
Docs: https://nodejs.org/

---

## 🚀 Framework
- Express.js — v4.18.2  
Docs: https://expressjs.com/

---

## 🗄️ Database
- MongoDB — v7.0  
Docs: https://www.mongodb.com/

---

## 🔗 ORM
- Mongoose — v8.1.1  
Docs: https://mongoosejs.com/

---

## 🔐 Auth
- jsonwebtoken — v9.0.2  
Docs: https://github.com/auth0/node-jsonwebtoken

---

## 🔑 Hashing
- bcrypt — v5.1.1  
Docs: https://www.npmjs.com/package/bcrypt

---

## 📁 Uploads
- Multer — v1.4.5-lts.1  
Docs: https://github.com/expressjs/multer

---

## ☁️ Storage
- Cloudinary — v1.41.0  
Docs: https://cloudinary.com/documentation

---

## 📧 Email
- Nodemailer — v6.9.8  
Docs: https://nodemailer.com/

---

# 3. ENVIRONMENT VARIABLES

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/nutrivision
JWT_SECRET=secret
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
CORS_ORIGIN=http://localhost:5173
```

---

# 4. SCRIPTS

```json
{
  "dev": "nodemon server.js",
  "start": "node server.js"
}
```

---

# 5. DEPENDENCIES

```json
{
  "express": "4.18.2",
  "mongoose": "8.1.1",
  "jsonwebtoken": "9.0.2",
  "bcrypt": "5.1.1"
}
```

---

# 6. SECURITY

- JWT expiry: 7 days  
- bcrypt rounds: 10  
- Rate limit: 100 req / 15 min  

---

# 7. CI/CD

- GitHub Actions pipeline  
- Lint → Build → Deploy  

---

# ✅ Summary

Stable, scalable, MVP-ready stack.
