# 📄 BACKEND STRUCTURE DOCUMENT  
## Product: NutriVision Analytics

---

## 🧭 App Description

AI-powered food analysis platform that allows users to upload food images, receive nutritional insights, track history, and manage profiles.

---

## 🧱 Main Features (DB-backed)

- User authentication & profile
- Food analysis results
- Detection history
- Health insights (aggregated)
- File uploads

---

# 1. Architecture Overview

- **Pattern:** MVC (Controller → Service → Model)
- **Auth Strategy:** JWT (access + refresh tokens)
- **Data Flow:**
  Client → API → Controller → Service → DB → Response
- **Caching:** Redis for recent analysis + insights

---

# 2. Database Schema

## 🧑 users

| name | type | constraints | description |
|------|------|------------|-------------|
| id | UUID | PK | user id |
| email | VARCHAR(255) | UNIQUE, NOT NULL | user email |
| password_hash | VARCHAR(255) | NOT NULL | hashed password |
| name | VARCHAR(100) | NOT NULL | full name |
| age | INT | | user age |
| created_at | TIMESTAMP | DEFAULT NOW() | created |
| updated_at | TIMESTAMP | DEFAULT NOW() | updated |

---

## 🍱 food_entries

| name | type | constraints | description |
|------|------|------------|-------------|
| id | UUID | PK | entry id |
| user_id | UUID | FK → users(id) ON DELETE CASCADE | owner |
| image_url | VARCHAR(500) | NOT NULL | image |
| calories | INT | | kcal |
| protein | FLOAT | | protein |
| carbs | FLOAT | | carbs |
| fat | FLOAT | | fat |
| created_at | TIMESTAMP | DEFAULT NOW() | created |
| updated_at | TIMESTAMP | DEFAULT NOW() | updated |

---

# 3. API Endpoints

## 🔐 POST /api/auth/register
- Auth: No

### Request
```json
{
  "email": "test@example.com",
  "password": "123456",
  "name": "John"
}
```

### Validation
- email: valid format
- password: min 6 chars

### Response
```json
{
  "message": "User created"
}
```

### Errors
- 400: invalid input
- 409: email exists

---

## 🔐 POST /api/auth/login

### Response
```json
{
  "accessToken": "jwt",
  "refreshToken": "jwt"
}
```

---

## 🍱 POST /api/food

- Auth: Yes

### Request
```json
{
  "imageUrl": "url"
}
```

### Response
```json
{
  "id": "uuid",
  "calories": 250
}
```

---

# 4. Authentication

- JWT payload:
```json
{
  "userId": "uuid",
  "email": "string"
}
```

- Access token: 15m  
- Refresh token: 7d  
- bcrypt rounds: 10  

---

# 5. Error Format

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Invalid request"
  }
}
```

---

# 6. Caching Strategy

- Key: user:{id}:history  
- TTL: 300s  

---

# 7. Rate Limiting

- Auth: 5 req/min  
- API: 100 req/15 min  

---

# 8. Migration Strategy

- Tool: mongoose migrations  
- Process:
  - create migration
  - run up/down
