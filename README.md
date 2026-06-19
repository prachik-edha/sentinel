# 🛡️ Sentinel — Cybersecurity Monitoring Platform

A full-stack cybersecurity monitoring platform that detects brute-force attacks, suspicious login behavior, credential stuffing, and security threats in real time.

## 🚀 Features

- **Brute Force Detection** — Flags accounts with 5+ failed login attempts in 60 seconds
- **IP Risk Scoring** — Detects same IP targeting multiple accounts
- **Account Auto-Lock** — Automatically locks suspicious accounts for 15 minutes
- **Real-Time Dashboard** — Live event feed, flagged events, and risk reports
- **Admin Controls** — Admin can view all users and unlock locked accounts
- **Geo Location** — Tracks login location (city, country) per event
- **JWT Authentication** — Secure role-based access (user/admin)

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| Geo IP | ip-api.com |

## 📁 Project Structure

```
sentinel/
├── backend/
│   └── src/
│       ├── models/        # User, LoginEvent schemas
│       ├── controllers/   # Auth, Dashboard logic
│       ├── routes/        # API endpoints
│       ├── middleware/     # JWT auth, admin check
│       └── utils/         # GeoIP, Detection engine
└── frontend/
    └── src/
        ├── pages/         # Login, Register, Dashboard
        ├── context/       # Auth state management
        └── api/           # Axios instance
```

## 🔧 Local Setup

### Prerequisites
- Node.js
- MongoDB

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables (backend/.env)
```
PORT=8000
MONGO_URI=mongodb://localhost:27017/sentinel
JWT_SECRET=your_secret_key
```

## 📊 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login + threat detection |
| GET | /api/dashboard/stats | Dashboard statistics |
| GET | /api/dashboard/events/recent | Recent login events |
| GET | /api/dashboard/events/flagged | Flagged events |
| GET | /api/dashboard/users | All users (admin only) |
| PATCH | /api/dashboard/users/:username/unlock | Unlock user (admin only) |

## 👩‍💻 Author

**Prachi Kumari** — [LinkedIn](https://linkedin.com/in/prachi-kumari-7b58052ab) | [GitHub](https://github.com/prachik-edha)
