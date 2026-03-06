# Server (Node.js + Express + MongoDB)

Backend APIs for leave, attendance, workforce, recruitment, learning, and candidate portal.

## Setup
```bash
cd server
npm install
npm run dev
```

Default API URL: `http://localhost:5000/api`

## Environment
Create `server/.env` with at least:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=change_me
ACCESS_TOKEN_SECRET=change_me_access
REFRESH_TOKEN_SECRET=change_me_refresh
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d
FRONTEND_URL=http://localhost:5173
COOKIE_SECURE=false
COOKIE_DOMAIN=
```

## Auth Token Flow (Employee/Admin)
- `POST /api/auth/login` issues:
  - `accessToken` cookie (short-lived)
  - `refreshToken` cookie (long-lived)
- `POST /api/auth/refresh` rotates session cookies.
- Protected APIs read `accessToken` from cookies (Bearer token fallback supported).
- `POST /api/auth/logout-session` clears current session and auth cookies.

## Scripts
- `npm run dev` start with nodemon
- `npm start` start with node
- `npm run create-admin`
- `npm run create-super-admin`
