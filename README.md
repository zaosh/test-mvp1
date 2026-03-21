# TESTLAB — Internal Testing Database

Production-grade, security-hardened internal testing database for engineering teams. Manages test plans, test cases (with forking), test runs, issues, and compliance archives with full role-based access control and audit logging.

## Prerequisites

- Node.js 18+
- Docker + Docker Compose
- mkcert (for local HTTPS — required, not optional)

## First-Time Setup

```bash
# 1. Copy environment file and fill in ALL variables
cp .env.local.example .env.local

# 2. Generate local HTTPS certificates
mkcert -install && mkcert localhost

# 3. Start PostgreSQL (prod config — no pgAdmin)
docker compose up -d

# 4. Install dependencies
npm install

# 5. Run database migrations
npx prisma migrate dev --name init

# 6. Set seed passwords in .env.local (SEED_*_PASSWORD vars)
# Then seed the database
npx prisma db seed

# 7. Start the development server
npm run dev
```

## Backup Setup (required)

```bash
chmod +x scripts/backup.sh
# Add to crontab:
# 0 2 * * * /absolute/path/to/scripts/backup.sh
# Verify backup directory: /var/testlab/backups
```

## Login

All seeded users must change password on first login. Credentials are whatever you set in `SEED_*_PASSWORD` env vars.

| Email                        | Role     |
|------------------------------|----------|
| admin@testlab.internal     | ADMIN    |
| qa@testlab.internal        | QA       |
| eng1@testlab.internal      | ENGINEER |
| eng2@testlab.internal      | ENGINEER |
| manager@testlab.internal   | MANAGER  |

## Role Permissions

| Role     | Access                                           |
|----------|--------------------------------------------------|
| ADMIN    | Full access, user management, session revocation |
| QA       | Full test access, create archives, conclude tests|
| ENGINEER | Log runs, create/update own issues, read tests   |
| MANAGER  | Read-only everywhere                             |

## How to Fork a Test

1. Open any test case
2. Click "Fork this test"
3. Enter fork reason (required, min 10 chars)
4. Override any parameters you want to change
5. New fork appears in the fork tree at depth + 1
6. Max depth: 5 levels

## How to Conclude and Archive

1. All test cases in a plan must be in CONCLUDED or WAIVED status
2. Open the test plan — "Conclude Plan" button becomes active
3. Fill in: title, category, outcome, summary, findings
4. Archive is created and immutable immediately
5. Test plan is marked CONCLUDED

## Security Notes

- **Password hashing**: argon2id (memoryCost: 65536, timeCost: 3, parallelism: 4)
- **Sessions**: expire after 8 hours, httpOnly, sameSite strict
- **Account lockout**: 5 failed login attempts → 15 min lockout
- **Force password change**: all seeded users must change password on first login
- **Session revocation**: ADMIN can force-logout any user via API
- **Audit logging**: all mutations logged to AuditLog (append-only)
- **Archives**: immutable — no update or delete routes exist
- **File attachments**: served through authenticated API only, stored outside web root
- **Input validation**: Zod schemas on every API route, parameterized queries only
- **CORS/CSP**: security headers on all API routes
- **pgAdmin**: run with `docker compose -f docker-compose.dev.yml up` — never run in production

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database**: PostgreSQL 15 via Docker (bound to 127.0.0.1 only)
- **ORM**: Prisma
- **Auth**: NextAuth.js (credentials, JWT, role-based, hardened)
- **Password hashing**: argon2
- **Styling**: TailwindCSS
- **Charts**: Recharts
- **Validation**: Zod + React Hook Form
- **Dates**: date-fns

## Phase 2 Roadmap

- GitHub webhook: auto-create test plans on PR/release events
- GitHub Status API: push test outcome to commit status
- Email notifications: overdue tests, critical issues
- PDF export for archive documents
- Two-factor authentication
- SSO / SAML integration
