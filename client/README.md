# Client (React + Vite)

Frontend for employee/admin and candidate portals.

## Setup
```bash
cd client
npm install
npm run dev
```

Default app URL: `http://localhost:5173`

## Environment
Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_PORT=5000
```

## Auth Behavior
- Employee/Admin auth uses httpOnly cookies from backend.
- Frontend sends credentials with requests and auto-refreshes access token on 401.
- No access token is stored in localStorage for employee/admin flow.

## Scripts
- `npm run dev` start dev server
- `npm run build` production build
- `npm run preview` preview build
