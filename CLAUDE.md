# CLAUDE.md — VSRMS Developer Reference

> Quick-start guide for any Claude Code session or new developer on this project.
> Read this before touching any source file.

---

## 1. Project Identity

**VSRMS** — Vehicle Service & Repair Management System  
SE2020 Group Assignment (6 members) — 28 Mar to 18 Apr 2026  
Full-stack mobile app connecting vehicle owners with repair workshops in Sri Lanka.  
Deployed backend: Render.com · Mobile: Expo Go / standalone APK

---

## 2. Technology Stack

### Backend — `vsrms-backend/`
| Concern | Library |
|---------|---------|
| Runtime | Node.js + Express.js (CommonJS only — no ESM ever) |
| Database | MongoDB Atlas M0 via Mongoose ODM |
| Auth | Asgardeo (WSO2) — ROPC grant proxied by backend; JWT validated via JWKS |
| Storage | Cloudflare R2 (S3-compatible) via `@aws-sdk/client-s3` |
| File uploads | Multer with memory storage |
| Validation | express-validator |
| Security | helmet, express-rate-limit, express-mongo-sanitize, express-async-errors |
| Deployment | Render.com free tier |

### Mobile — `vsrms-mobile/`
| Concern | Library |
|---------|---------|
| Framework | React Native + Expo (TypeScript) |
| Routing | Expo Router (file-based, `src/app/`) |
| Architecture | Feature-slice (`src/features/[domain]/`) |
| HTTP | Axios — single instance in `src/services/http.client.ts` |
| Server state | `@tanstack/react-query` via `QueryProvider` |
| Auth state | `src/providers/AuthProvider.tsx` |
| Styling | react-native-unistyles — **never `StyleSheet.create()`** |

---

## 3. Directory Structure

```
vehicle-repair-rms/
  CLAUDE.md          ← This file
  TASK.md            ← Sprint board
  plan.md            ← Detailed implementation plan
  vsrms-backend/
    server.js                      Entry point
    src/
      config/db.js, r2.js
      controllers/                 auth, vehicle, workshop, appointment, record, review
      middleware/                  auth.middleware.js, errorHandler.js, rateLimiter.js,
                                   roles.js, validate.js
      models/                      User, Vehicle, Workshop, Appointment, ServiceRecord, Review
      routes/                      auth, vehicle, workshop, appointment, record, review
      utils/geoHelper.js, reviewHelper.js
  vsrms-mobile/
    src/
      app/                         Expo Router pages
        auth/login.tsx, register.tsx
        tabs/                      Customer tabs (index, vehicles/, workshops/, schedule)
        owner/                     Workshop owner (index, bookings, jobs, logs, staff, settings)
          workshops/               Owner workshop management (list, [id])
        technician/                Staff (index, appointments, record, tracker)
        admin/                     Admin (index, garages, users)
      features/                    Feature-slice domains
        auth/ vehicles/ workshops/ appointments/ records/ reviews/
        Each has: api/ queries/ screens/ components/ types/ index.ts
      components/feedback/ layout/ navigation/ ui/
      providers/AuthProvider.tsx, QueryProvider.tsx, ToastProvider.tsx
      services/http.client.ts, storage.service.ts, location.service.ts,
               upload.service.ts, error.handler.ts
      theme/tokens.ts, typography.ts, breakpoints.ts, unistyles.ts
      types/api.types.ts, auth.types.ts, navigation.types.ts
```

---

## 4. Module Ownership

| ID | Module | Backend | Mobile screens |
|----|--------|---------|----------------|
| M1 | Auth + User Profile + Admin | auth.controller.js, auth.route.js | auth/, tabs/index (profile), admin/users |
| M2 | Vehicle Management + Image Upload | vehicle.controller.js, vehicle.route.js | tabs/vehicles/, features/vehicles/screens/ |
| M3 | Workshop Management + Location + Image Upload | workshop.controller.js, workshop.route.js | tabs/workshops/, features/workshops/screens/, admin/garages |
| M4 | Appointment Booking | appointment.controller.js, appointment.route.js | tabs/schedule, features/appointments/, technician/appointments |
| M5 | Service Records & History | record.controller.js, record.route.js | features/records/screens/, owner/jobs, owner/create-record |
| M6 | Ratings & Reviews | review.controller.js, review.route.js | features/reviews/screens/ |

**R2 Upload pipeline** — shared middleware in `src/middleware/upload.js` (or inline in controllers).  
M2 wires it for vehicle images. M3 wires it for workshop images. Both own/explain their route.

---

## 5. API Endpoints (all under `/api/v1`)

> All protected routes require `Authorization: Bearer <JWT>`.  
> All list responses: `{ data, page, limit, total, pages }`.  
> Pagination query: `?page=&limit=` (default page 1, limit 20, max 100).

### Auth (M1)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | /auth/login | Public | Proxies ROPC grant to Asgardeo. Returns access_token. |
| POST | /auth/register | Public | Creates user in Asgardeo via SCIM2. |
| POST | /auth/sync-profile | JWT | Upserts MongoDB User from JWT claims. Call after every login. |
| GET | /auth/me | JWT | Returns own MongoDB User document. |
| PUT | /auth/me | JWT | Updates fullName and/or phone only. |
| GET | /auth/users | Admin | Paginated list of all users. |
| DELETE | /auth/users/:id | Admin | Soft-deactivate (active:false). Cannot deactivate self. |

### Vehicles (M2)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | /vehicles | JWT | Create vehicle. ownerId set from JWT. |
| GET | /vehicles | JWT | List own non-deleted vehicles. |
| GET | /vehicles/:id | JWT | Ownership enforced (403 if not owner). |
| PUT | /vehicles/:id | JWT | Ownership enforced. Cannot change ownerId. |
| DELETE | /vehicles/:id | JWT | Soft delete — sets deletedAt, document stays. |
| POST | /vehicles/:id/image | JWT | Multer + R2 upload. Saves imageUrl. |

### Workshops (M3)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | /workshops | Admin/Owner | Create workshop. |
| GET | /workshops | Public | Paginated. Optional ?district= filter. |
| GET | /workshops/nearby | Public | ?lat=&lng=&maxKm= (default 50km). Up to 20 results by distance. |
| GET | /workshops/mine | Owner/Admin | List own workshops. |
| GET | /workshops/:id | Public | Single workshop. |
| PUT | /workshops/:id | Owner/Admin | Update workshop. Ownership enforced. |
| DELETE | /workshops/:id | Admin | Soft delete (active:false). |
| POST | /workshops/:id/image | Owner/Admin | Multer + R2 upload. |
| GET | /workshops/:id/technicians | Owner/Admin | List assigned technicians. |
| POST | /workshops/:id/technicians | Owner | Add technician to workshop. |
| DELETE | /workshops/:id/technicians/:userId | Owner | Remove technician from workshop. |

**CRITICAL**: `/workshops/nearby` MUST be registered BEFORE `/:id` in the route file.

### Appointments (M4)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | /appointments | JWT | scheduledDate must be > now. Checks double booking. |
| GET | /appointments/mine | JWT | Paginated. Optional ?status= filter. |
| GET | /appointments/:id | JWT | Ownership/role enforced. |
| PUT | /appointments/:id | JWT | Only if status===pending. Ownership enforced. |
| PUT | /appointments/:id/status | Staff/Admin | Forward-only state machine. |
| DELETE | /appointments/:id | JWT | Only if status===pending. Ownership enforced. |

**CRITICAL**: `/appointments/mine` MUST be registered BEFORE `/:id`.

### Service Records (M5)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | /records | Staff | Create record. |
| GET | /records/vehicle/:vehicleId | JWT | Owners see own vehicles only. Staff/admin see all. |
| GET | /records/:id | JWT | Same ownership rule. |
| PUT | /records/:id | Staff | Update record. |
| DELETE | /records/:id | Admin | Hard delete. |

**CRITICAL**: `/records/vehicle/:vehicleId` MUST be registered BEFORE `/:id`.

### Reviews (M6)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | /reviews | JWT | Rating integer 1-5. Recalculates workshopAverageRating. |
| GET | /reviews/workshop/:workshopId | Public | Paginated, newest first. |
| GET | /reviews/mine | JWT | Paginated, own reviews. |
| GET | /reviews/:id | JWT | Single review. |
| PUT | /reviews/:id | JWT | Ownership enforced. Recalculates averageRating. |
| DELETE | /reviews/:id | JWT | Ownership enforced. Recalculates averageRating. |

**CRITICAL**: `/reviews/workshop/:workshopId` and `/reviews/mine` MUST be registered BEFORE `/:id`.

---

## 6. Architecture Rules — Non-Negotiable

### Backend owns ALL logic
- All input validation (express-validator) — even if mobile also validates for UX
- All auth and authorisation checks (JWT, role guards, ownership)
- All business rules: date validation, status state machine, double booking
- All calculations: averageRating recalculation, geo-distance sorting
- All data shaping: pagination, filtering, excluding sensitive fields

### Mobile must NOT
- Recalculate averageRating — display what the API returns
- Filter or sort arrays in JS — pass `?status=` or other params to backend instead
- Check ownership or role on the client — trust only what backend enforces
- Store anything sensitive in AsyncStorage beyond the access token

### Feature-slice rules (mobile)
- `api/` — plain Axios call wrappers. No logic, no error handling, no transformation.
- `queries/` — React Query hooks. Cache config only. No business rules.
- `screens/` — consume hooks, display data. No calculations. No direct API calls.
- `components/` — pure UI. Props in, JSX out. No data fetching.
- `types/` — TypeScript interfaces matching API response shapes exactly.

---

## 7. Key Business Logic

### Authentication flow
1. Mobile calls `POST /auth/login` with email + password.
2. Backend proxies ROPC grant to Asgardeo and returns `access_token`.
3. Mobile stores token in AsyncStorage.
4. Mobile calls `POST /auth/sync-profile` to upsert MongoDB User record.
5. Every subsequent API call includes `Authorization: Bearer <token>`.
6. Backend validates JWT via Asgardeo JWKS endpoint (stateless, no session store).
7. `protect` middleware attaches `req.user` (MongoDB doc) and `req.jwtClaims` (raw JWT).

### sync-profile
MUST use `findOneAndUpdate` with `upsert:true` on `asgardeoSub`. Never `User.create()`.

### Soft delete (vehicles only)
DELETE sets `deletedAt = Date.now()`. Document never removed from DB.
Every vehicle query MUST include `{ deletedAt: null }` in filter.

### GeoJSON coordinate order
MongoDB GeoJSON always `[longitude, latitude]` — NOT [lat, lng].
`$maxDistance` is in **metres** — multiply km × 1000.

### Double booking
When creating an appointment: find any existing appointment with same `workshopId`,
same calendar day (midnight to midnight), and `status` in `[pending, confirmed, in_progress]`.
Return 409 if conflict found.

### Appointment status state machine
```
pending → confirmed | cancelled
confirmed → in_progress | cancelled
in_progress → completed
completed → (terminal)
cancelled → (terminal)
```
Only staff/admin can advance status. Owners cancel via DELETE while pending only.
`Appointment.isValidTransition(from, to)` — static method on the model.

### averageRating recalculation
After every review POST, PUT, DELETE: run `recalculateRating(workshopId)` from `utils/reviewHelper.js`.
This aggregates all reviews and calls `Workshop.findByIdAndUpdate` atomically.
NEVER run aggregation on GET requests — read the pre-computed value.

### Multer + R2 upload
Multer: memory storage, max 5MB, jpeg/png only (400 on failure).
Key format: `{vehicles|workshops}/{docId}/{timestamp}-{originalname}`.
Save returned public URL to `imageUrl` field on the document.

### Service record ownership
Owners: can only access records for vehicles they own (`vehicle.ownerId === req.user._id`).
Staff/Admin: can access records for any vehicle.

---

## 8. Mongoose Schema Requirements

- Every schema: `{ timestamps: true }` — mandatory.
- Never `unique:true` on field definition AND `.index()` — use `.index()` only.
- Exclude `__v` via `.select('-__v')` on all queries.

### Required indexes
| Model | Indexes |
|-------|---------|
| User | unique on `asgardeoSub`, unique on `email` |
| Vehicle | `ownerId`, unique `registrationNo`, `deletedAt` |
| Workshop | `2dsphere` on `location`, `district`, desc `averageRating`, `ownerId`, `active` |
| Appointment | `userId`, `workshopId`, `vehicleId`, `status`, compound `(workshopId, scheduledDate)` |
| ServiceRecord | `vehicleId`, `appointmentId` |
| Review | `workshopId`, `userId`, unique compound `(workshopId, userId)` — one review per user per workshop |

---

## 9. Middleware Requirements

### errorHandler.js
Exports `AppError` (custom Error with `statusCode` + `isOperational`) and `globalErrorHandler`.
Converts: Mongoose ValidationError→400, DuplicateKey 11000→409, CastError→400, JWT errors→401.
In production: never expose 5xx error messages — return "Internal server error" only.

### auth.middleware.js
JWKS client created once at module load (not per request). Cache enabled, min 10 min.
After JWT verify: look up user in MongoDB by `asgardeoSub`, check `active:true`.
Attaches `req.user` (full MongoDB doc) and `req.jwtClaims` (raw JWT payload).
If user not found in MongoDB: return 401 directing client to call sync-profile.

### rateLimiter.js
`apiLimiter`: 100 req/15 min on all `/api/v1` routes (configurable via env vars).
`authLimiter`: 20 req/15 min on auth routes only (not configurable).

### validate.js
Single middleware that reads `validationResult(req)` and passes 400 `AppError` to `next()`.
Used after validation rule arrays and before controller functions in every POST/PUT route.

### Middleware order in server.js
`dotenv` → `express-async-errors` → `cors` → `helmet` → `express.json(10kb)` →  
`express-mongo-sanitize` → `apiLimiter` → routes → `globalErrorHandler` (very last).

---

## 10. Mobile Conventions

### http.client.ts
Single Axios instance with `baseURL` from `EXPO_PUBLIC_API_URL`.
Request interceptor: reads token from AsyncStorage, adds `Authorization: Bearer`.
Response interceptor: normalises errors → `error.response.data.error` → `error.message` → generic string.
ALL `features/*/api/*.api.ts` import from here — never create a second Axios instance.

### React Query config
- staleTime 5 min: workshops, vehicles (infrequently changing)
- staleTime 0: appointments, reviews (frequently changing)
- On successful mutations: invalidate relevant query keys so lists auto-refresh.

### Screen rules
- Always use hooks from `queries/` — never call API functions directly in a screen.
- Loading state: `Skeleton` from `components/feedback/Skeleton.tsx`.
- Error state: `ErrorScreen` from `components/feedback/ErrorScreen.tsx` (with retry button).
- Empty lists: `EmptyState` from `components/ui/EmptyState.tsx`.

### AuthProvider
- Stores access token in AsyncStorage on login.
- Calls `POST /auth/sync-profile` immediately after storing token.
- Exposes `user`, `isLoading`, `signIn`, `signOut` via context.
- `signOut`: clears AsyncStorage, clears React Query cache, navigates to `auth/login`.
- Role-based routing driven by `user.role` from this provider.

### Styling
- Always `StyleSheet.create()` from `react-native-unistyles` — NEVER from `react-native`.
- Theme tokens: `src/theme/tokens.ts`, registered in `src/theme/unistyles.ts`.

---

## 11. Environment Variables

### Backend — `vsrms-backend/.env`
```
PORT                    API port (default 5000)
NODE_ENV                development | production
ALLOWED_ORIGINS         Comma-separated CORS origins (no wildcard in production)
RATE_LIMIT_WINDOW_MS    Rate limit window ms (default 900000)
RATE_LIMIT_MAX          Max requests per window (default 100)
MONGODB_URI             Full MongoDB Atlas connection string
ASGARDEO_ORG_NAME       Asgardeo tenant org name
ASGARDEO_CLIENT_ID      OAuth client ID
ASGARDEO_CLIENT_SECRET  OAuth client secret (server-side only)
ASGARDEO_ISSUER         JWT issuer URL
ASGARDEO_JWKS_URL       JWKS endpoint URL
ASGARDEO_AUDIENCE       (optional) Expected JWT audience
R2_ACCOUNT_ID           Cloudflare account ID
R2_ACCESS_KEY_ID        R2 access key
R2_SECRET_ACCESS_KEY    R2 secret key
R2_BUCKET_NAME          R2 bucket name
R2_PUBLIC_URL           Public base URL (e.g. https://pub-xxx.r2.dev)
```

### Mobile — `vsrms-mobile/.env`
```
EXPO_PUBLIC_API_URL     Full backend URL including /api/v1 (e.g. https://vsrms.onrender.com/api/v1)
```

---

## 12. Hard Constraints — Never Violate

- Do NOT add `"type": "module"` to backend `package.json`
- Do NOT convert backend `require()` to `import/export`
- Do NOT add paid services (Stripe, Twilio, SendGrid, Firebase)
- Do NOT add Docker, Redis, Kafka, or any message queue
- Do NOT add GraphQL — REST only
- Do NOT change the auth provider from Asgardeo
- Do NOT add a web admin dashboard — mobile only
- Do NOT add push notifications
- Do NOT exceed MongoDB M0 limits (512MB, 100 max connections)
- Do NOT use `StyleSheet.create()` from `react-native` — always use `react-native-unistyles`
- Do NOT create a second Axios instance — always import from `services/http.client.ts`
- Do NOT filter, sort, or recalculate on mobile what the backend already returns
- Do NOT filter tabs (Upcoming/Past) on the client — pass `?status=` params to the backend
- Do NOT hardcode workshop hours, description, or specialization — these come from the API

---

## 13. Known Bugs to Fix

| B1 | `appointment.controller.js:20` | `const { ..., status } = paginate(req.query)` — `paginate()` never returns `status` so it is always `undefined` | Extract `const { status } = req.query` separately after calling `paginate()` |
| B2 | `features/auth/screens/LoginScreen.tsx` | Real sign-in button uses `setTimeout` + fake error; never calls `POST /auth/login` | **FIXED** |
| B3 | `features/appointments/screens/AppointmentListScreen.tsx` | Upcoming/Past tabs filter client-side; the full unfiltered list is always fetched | Pass `?status=pending,confirmed,in_progress` or `completed,cancelled` to backend via query params |
| B4 | `features/workshops/screens/WorkshopDetailScreen.tsx` | Uses `workshop.specialization` — field does not exist in schema (schema has `servicesOffered`) | **FIXED** |
| B5 | `features/workshops/screens/WorkshopDetailScreen.tsx` | `workshop.description` field does not exist in Workshop schema | Either add `description` field to Workshop schema/model, or remove the fallback hardcoded text |
| B6 | `app/tabs/workshops/` | Book Appointment navigates to `/tabs/workshops/book/${id}` | Create the booking screen and route |
| B7 | `app/tabs/schedule/` | Book button navigates to `/tabs/schedule/book` | Create the booking screen and route |
| B8 | `app/admin/garages.tsx` | Admin Garages screen crashed on load due to hook name typo | **FIXED** |

---

## 14. Roles and Navigation

| Role | Default route | Can access |
|------|--------------|------------|
| `customer` | `/tabs` | tabs/ (profile, vehicles, workshops, schedule) |
| `workshop_owner` | `/owner` | owner/ (dashboard, bookings, jobs, workshops, staff, logs) |
| `workshop_staff` | `/technician` | technician/ (dashboard, appointments, record, tracker) |
| `admin` | `/admin` | admin/ (dashboard, garages, users) |

Role-based routing is enforced in `src/app/_layout.tsx` (`InitialLayout`).

---

## 15. Development Commands

```bash
# Backend
cd vsrms-backend
npm run dev          # nodemon server.js
npm start            # node server.js

# Mobile
cd vsrms-mobile
npx expo start       # start Expo dev server
npx expo start --clear   # clear cache and start
```

---

## 16. Deployment Checklist

- [ ] `vsrms-backend/.env` configured with real Asgardeo and MongoDB credentials
- [ ] Backend deployed to Render.com, GET /health returns `{ status: "ok" }`
- [ ] `EXPO_PUBLIC_API_URL` set to the Render URL (`.../api/v1`)
- [ ] MongoDB Atlas connection working (M0 free tier)
- [ ] R2 bucket configured, `R2_PUBLIC_URL` accessible
- [ ] CORS `ALLOWED_ORIGINS` set correctly (no wildcard in production)
- [ ] Rate limiter env vars set
