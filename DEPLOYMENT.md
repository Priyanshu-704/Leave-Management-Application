# Deployment Guide (Free Tier)

## Recommended Stack
- Frontend: Netlify (free static hosting)
- Backend API: Render Web Service (free tier)
- Database: MongoDB Atlas M0 (free shared cluster)

## 1) Deploy Backend (Render)
1. Push this repo to GitHub.
2. In Render, create service from `render.yaml` (Blueprint) or create a Node Web Service manually.
3. Set backend env vars:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `FRONTEND_URL` = your Netlify URL (example: `https://your-site.netlify.app`)
   - `API_BASE_URL` = your Render API base URL (example: `https://leave-management-api.onrender.com`)
   - `CORS_ORIGINS` = your Netlify URL (comma-separated if multiple)
   - `COOKIE_SECURE=true`
   - `COOKIE_SAME_SITE=none`
4. Deploy and verify `https://<render-service>.onrender.com/api-docs`.

## 2) Deploy Frontend (Netlify)
1. Import repo into Netlify.
2. Build settings:
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `client/dist`
3. Add frontend env vars:
   - `VITE_API_URL=https://<render-service>.onrender.com/api`
   - `VITE_WS_URL=wss://<render-service>.onrender.com/ws/chat`
4. Deploy.

`netlify.toml` already contains SPA fallback redirect so routes like `/dashboard` work on refresh.

## 3) MongoDB Atlas
1. Create a free M0 cluster.
2. Create DB user + password.
3. Add Render outbound IP access rule (`0.0.0.0/0` for quick start, then tighten later).
4. Put the Atlas connection string into `MONGO_URI`.

## 4) Post-deploy Checks
- Open frontend and log in.
- Verify API calls succeed in browser Network tab.
- Confirm auth cookies are set (`Secure`, `SameSite=None`).
- Test live chat websocket connection.

## Notes
- Render free services can sleep on inactivity and wake with a cold-start delay.
- If you use custom domains later, update `FRONTEND_URL`, `CORS_ORIGINS`, `VITE_API_URL`, and `VITE_WS_URL`.
