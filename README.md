# BalanceVault – TrustLedger

A secure, full-stack financial account management platform built for the Snovasys Fresher Hiring Challenge 2026.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router 6, Axios |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (Neon) + Prisma ORM |
| Auth | JWT (access + refresh tokens), bcrypt |
| Security | Helmet, CORS, Redis rate limiting, RBAC |
| Testing | Jest, Supertest |
| Deployment | Vercel (frontend), Render (backend), Neon PostgreSQL |

---

## Project Structure

```
BalanceVault/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # All data models
│   │   └── seed.js             # Demo data seed
│   └── src/
│       ├── config/             # env, logger, database, redis
│       ├── middleware/         # auth, rateLimiter, validate, errorHandler, auditLogger
│       ├── routes/             # auth, onboarding, accounts, transfers, admin, health
│       ├── controllers/        # Request handlers
│       ├── services/           # Business logic layer
│       ├── validators/         # express-validator chains
│       ├── utils/              # errors, response, money, accountNumber, adminBootstrap
│       ├── app.js              # Express app setup
│       └── server.js           # Entry point
└── frontend/
    └── src/
        ├── context/            # AuthContext
        ├── services/           # api.js (Axios client)
        ├── hooks/              # useApi
        ├── pages/
        │   ├── auth/           # LoginPage, RegisterPage
        │   ├── user/           # Dashboard, Accounts, Transfer, Transactions, Profile, Onboarding
        │   └── admin/          # Dashboard, Users, Onboarding, Accounts, Transactions, AuditLogs, Ledger
        ├── components/common/  # Navbar, LoadingSpinner, Alert
        ├── utils/              # format.js
        └── styles/             # global.css
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL (local or Neon)
- Redis (optional — rate limiting falls back to memory without it)

### 1. Backend

```bash
cd backend

# Copy environment file
copy .env.example .env
# Edit .env with your real DATABASE_URL, JWT_SECRET, etc.

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed demo data
npm run seed

# Start dev server
npm run dev
```

The API runs on **http://localhost:5000**

### 2. Frontend

```bash
cd frontend

# Copy environment file
copy .env.example .env
# VITE_API_BASE_URL=http://localhost:5000/api/v1

# Install dependencies
npm install

# Start dev server
npm run dev
```

The frontend runs on **http://localhost:5173**

---

## Environment Variables

### Backend `.env`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `TEST_DATABASE_URL` | | Optional dedicated database for Jest; falls back to `DATABASE_URL` if not set |
| `JWT_SECRET` | ✅ | Secret for access tokens (64+ chars) |
| `JWT_REFRESH_SECRET` | ✅ | Secret for refresh tokens |
| `JWT_EXPIRES_IN` | | Access token TTL (default: 15m) |
| `JWT_REFRESH_EXPIRES_IN` | | Refresh token TTL (default: 7d) |
| `REDIS_URL` | | Redis connection (optional) |
| `ADMIN_BOOTSTRAP_ENABLED` | | Set `true` ONCE to create first admin |
| `ADMIN_BOOTSTRAP_EMAIL` | | First admin email |
| `ADMIN_BOOTSTRAP_PASSWORD` | | First admin password |
| `BCRYPT_ROUNDS` | | bcrypt work factor (default: 12) |
| `PORT` | | API port (default: 5000) |
| `FRONTEND_URL` | | Allowed CORS origin |

### Frontend `.env`

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API base URL |

---

## Admin Bootstrap (First-Time Setup)

There is no public admin registration. To create the first admin:

1. Set in `.env`:
   ```
   ADMIN_BOOTSTRAP_ENABLED=true
   ADMIN_BOOTSTRAP_EMAIL=admin@yourdomain.com
   ADMIN_BOOTSTRAP_PASSWORD=StrongPassword!123
   ```
2. Start the server once — the admin account is created automatically.
3. **Immediately** set `ADMIN_BOOTSTRAP_ENABLED=false` and change the password.

---

## Demo Accounts (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@balancevault.internal | Admin@12345 |
| User (approved) | alice@example.com | Alice@12345 |
| User (approved) | bob@example.com | Bob@12345 |
| User (pending) | carol@example.com | Carol@12345 |

---

## API Reference

### Health
```
GET /health      — Liveness probe
GET /ready       — Readiness probe (DB + Redis)
```

### Auth `POST /api/v1/auth/`
```
POST /register   — Create account holder
POST /login      — Get access + refresh tokens
GET  /me         — Current user profile [auth]
POST /logout     — Invalidate session [auth]
POST /refresh    — Refresh access token
```

### Onboarding `/api/v1/onboarding/`
```
POST /submit     — Submit KYC application [auth, ACCOUNT_HOLDER]
GET  /status     — Get onboarding status [auth]
```

### Accounts `/api/v1/accounts/`
```
POST /           — Open new account [auth, ACCOUNT_HOLDER, approved]
GET  /           — List my accounts [auth]
GET  /:id        — Get account details [auth, owner|admin]
GET  /:id/transactions — Account transaction history [auth, owner|admin]
```

### Transfers `/api/v1/transfers/`
```
POST /           — Initiate transfer [auth, ACCOUNT_HOLDER]
GET  /:id        — Get transaction [auth, owner|admin]
```

### Admin `/api/v1/admin/` (all require ADMIN role)
```
GET  /stats                      — Dashboard stats
GET  /users                      — List users
GET  /users/:id                  — User details
PATCH /users/:id/status          — Activate/deactivate user
GET  /onboarding                 — List applications
GET  /onboarding/:id             — Application details
PATCH /onboarding/:id/review     — Approve or reject
GET  /accounts                   — All accounts
PATCH /accounts/:id/status       — Update account status
GET  /transactions               — All transactions
GET  /audit-logs                 — Audit event log
GET  /ledger/verify              — Run ledger integrity check
```

---

## Running Tests

Use a PostgreSQL database for the app and a separate test database (or reuse the same one) for Jest:

```bash
# Optional but recommended for CI/local test isolation
TEST_DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/balancevault_test?sslmode=disable"

cd backend
npm test
```

If `TEST_DATABASE_URL` is not set, the test setup automatically falls back to `DATABASE_URL`.

```bash
cd backend

# In .env or test environment
# TEST_DATABASE_URL=postgresql://...test_db...

npm test
```

Tests cover:
- Registration, login, authentication
- JWT authorization, role-based access control
- Admin-only endpoints
- Onboarding approval flow
- Account creation and ownership
- Successful money transfers
- Insufficient balance rejection
- Same-account transfer prevention
- Idempotency (duplicate transfer prevention)
- Double-entry ledger entry creation
- Transaction ownership isolation
- Audit log access

---

## Security Design

| Feature | Implementation |
|---|---|
| Password hashing | bcrypt, 12 rounds |
| Authentication | JWT (HS256), 15-minute access tokens |
| Token refresh | 7-day refresh token |
| Rate limiting | Redis-backed (IP + per-user), falls back to memory |
| Input validation | express-validator on all endpoints |
| RBAC | Role checked in middleware on every protected route |
| Account ownership | Service layer validates userId before every operation |
| Money arithmetic | Integer paise only — no floating point |
| Atomic transfers | PostgreSQL serializable transactions with row-level locks |
| Idempotency | Unique key per transfer stored in DB |
| Double-entry ledger | DEBIT + CREDIT entry per transaction, amounts must match |
| Audit logs | Every action logged with actor, outcome, timestamp, requestId |
| Security headers | Helmet (CSP, HSTS, etc.) |
| CORS | Explicit whitelist only |
| Error handling | Operational errors vs unknown errors; stack traces never sent to clients |
| Admin bootstrap | Environment variable only, never via public API |

---

## Financial Safety Guarantees

1. **No floats** — all amounts stored as integer paise (1 INR = 100 paise)
2. **Atomic transactions** — Prisma `$transaction` with `Serializable` isolation
3. **Deadlock prevention** — accounts locked in consistent ID order
4. **Overdraft prevention** — balance checked inside the locked transaction
5. **Idempotency** — same key returns cached response, never double-debits
6. **Double-entry ledger** — every transfer creates DEBIT + CREDIT pair
7. **Ledger verification** — admin endpoint detects missing, duplicate, or mismatched entries
8. **Full rollback** — any failure inside the transaction reverts all changes

---

## Deployment

### Backend (Render)

1. Create a new **Web Service** on Render
2. Set build command: `npm install && npx prisma generate && npx prisma migrate deploy`
3. Set start command: `npm start`
4. Add all environment variables from `.env.example`
5. Use **Neon PostgreSQL** as the database

### Frontend (Vercel)

1. Import the `frontend/` directory into Vercel
2. Set `VITE_API_BASE_URL` to your Render backend URL
3. Framework preset: **Vite**

### Database (Neon)

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string to `DATABASE_URL`
3. Run `npx prisma migrate deploy` to apply schema
4. Run `npm run seed` to load demo data

---

## License

Built for the Snovasys Fresher Hiring Challenge 2026.
