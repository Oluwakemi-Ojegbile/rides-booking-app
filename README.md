# Ride Booking App

A role-based ride-booking MVP. Riders request, track, cancel, review history and rate completed trips; drivers manage vehicle availability, accept requests, progress a trip and review trip history.

## Stack

- Frontend: React, Vite, React Router and Axios
- Backend: Node.js, Express, Mongoose, JWT, bcrypt, Helmet, CORS and rate limiting
- Database: MongoDB (local for development; MongoDB Atlas for production)

## Features and lifecycle

`requested → accepted → arrived → in_progress → completed`

Riders may cancel `requested`, `accepted`, or `arrived` rides. Assigned drivers may cancel `accepted` or `arrived` rides. Completed and cancelled rides are immutable. The driver is returned to availability at the terminal state.

## Layout

```text
frontend/  React client, pages, API services, route guards and polling hook
backend/   Express API, Mongoose models, validation, controllers and tests
```

MongoDB collections are `users`, `driverprofiles`, `rides`, and `ratings`. Unique indexes protect user email/phone, driver profile user/plate, and one rating per ride participant. Ride indexes support rider/driver status history and available-request queries.

## Local setup

1. Install Node.js 20+ and MongoDB 7+.
2. Create `backend/.env`:

```env
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/ride_booking_app
JWT_SECRET=replace-with-a-long-random-secret
INVITATION_ENCRYPTION_KEY=replace-with-a-different-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

3. Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5001/api
```

4. Install and run:

```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

Seed development accounts (never production data):

```bash
cd backend && npm run seed
```

## Testing and checks

```bash
cd backend && npm test && npm run build
cd frontend && npm run build
```

The backend test cleanup helper only permits deletion with `NODE_ENV=test` and a database name containing `test`. Point integration tests at a dedicated URI such as `mongodb://127.0.0.1:27017/ride_booking_test`; never use the development or production database.

## API

All protected endpoints require `Authorization: Bearer <JWT>`.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` |
| Rides | `POST /api/rides`, `GET /api/rides/current`, `GET /api/rides/:id`, `GET /api/rides/history` |
| Driver rides | `GET /api/rides/available`, `PATCH /api/rides/:id/accept`, `PATCH /api/rides/:id/arrive`, `PATCH /api/rides/:id/start`, `PATCH /api/rides/:id/complete`, `GET /api/drivers/rides/history` |
| Shared actions | `PATCH /api/rides/:id/cancel`, `POST /api/ratings` |
| Driver profile | `GET/PATCH /api/drivers/profile`, `PATCH /api/drivers/availability`, `PATCH /api/drivers/location` |
| Administration | `GET /api/admin/overview`, `GET /api/admin/users`, `PATCH /api/admin/users/:id/status`, `POST /api/admin/invitations`, `GET /api/admin/rides` (admin only) |
| Health | `GET /api/health` |

History accepts `page`, `limit`, and an optional comma-separated `status` filter. Roles are enforced server-side; only ride participants can read/cancel a ride, and only its assigned driver can advance it.

Administrators are never created through public registration. The initial development seed is a bootstrap account; signed-in administrators can create a single-use onboarding link for another administrator from the dashboard. Active links remain visible to administrators with a copy button until they are accepted or expire. Tokens are encrypted at rest with `INVITATION_ENCRYPTION_KEY` (or `JWT_SECRET` as a compatibility fallback); links should be shared via the organisation's secure channel. The development seed provides `admin.dev@example.com` with password `Oluwakemi@2`; change or remove this account outside development. Admins can inspect users and rides, filter platform data, and activate/deactivate accounts. Deactivating a driver also takes that driver offline.

## MongoDB Atlas

1. Create an Atlas project and free/shared cluster.
2. Create a least-privilege database user and add your deployment IP/network access rule.
3. Copy the SRV connection string into the backend host’s `MONGO_URI`; include the database name `ride_booking_app` or let the backend select it.
4. Do not put `MONGO_URI` or a JWT secret in the frontend or Git.

## Deployment

- Deploy `frontend` to Vercel or Netlify, set `VITE_API_BASE_URL=https://<backend-url>/api`, and configure SPA fallback to `index.html`.
- Deploy `backend` to Render or Railway. Set `NODE_ENV=production`, `MONGO_URI`, a long random `JWT_SECRET`, and `CLIENT_URL=https://<frontend-url>` in host-managed environment variables.
- The API starts only after MongoDB connects. `GET /api/health` reports a safe connection status.

The OpenAPI source is [docs/openapi.yaml](docs/openapi.yaml). Placeholders: frontend URL `https://<frontend-url>`, backend URL `https://<backend-url>`, API documentation URL `https://<backend-url>/api/docs`.

## Production notes

Helmet, CORS allow-listing, JWT role checks, request rate limiting and a 100 KB JSON limit are enabled. Use HTTPS at the hosting provider. The app does not delete any normal-startup data.
