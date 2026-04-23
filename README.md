# MWS Daily Check-In

Daily Emotional Check-In product for MWS — one of two applications split from the legacy MWS-APP monorepo. Sibling app: `mws-mtss-system`.

## Structure

```
mws-daily-checkin/
├── backend/     Express + MongoDB API (port 3003)
└── frontend/    React + Vite SPA (dev port 5173)
```

## Scope (what lives here)

- Daily emotional check-in flow (staff + student)
- Face scan / manual / AI check-in variants
- Personal emotional history, patterns, and dashboards
- Head-unit / directorate dashboards for check-in aggregates
- Shared auth (Google OAuth + JWT), user management, notifications

MTSS and the AI Assistant chat live in the `mws-mtss-system` repository.

## Local development

### Backend

```bash
cd backend
cp .env.example .env       # fill in secrets
npm install
npm run dev                # nodemon → http://localhost:3003
```

### Frontend

```bash
cd frontend
npm install
npm run dev                # vite → http://localhost:5173
```

The Vite dev server proxies `/api`, `/auth`, and `/socket.io` to the backend on port 3003.

## Integration with MTSS

Both products share the same Google OAuth users. Users with MTSS roles are redirected to the MTSS application (configured at deployment time); non-MTSS roles stay here.

## Deployment

Same Komodo-based architecture as the legacy stack. The repo ships with `Dockerfile` + `docker-compose.yml` — adjust `REPO`, image tags, and domain routing to match the new GitHub Organization before the first deploy.
