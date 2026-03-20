# DRONETEST — Internal Testing Database

Production-grade internal testing database for drone engineering teams. Manages test plans, test cases (with forking), test runs, issues, and compliance archives with full role-based access control.

## Prerequisites

- Node.js 18+
- Docker & Docker Compose

## Setup

```bash
# 1. Copy environment file
cp .env.local.example .env.local

# 2. Start PostgreSQL and pgAdmin
docker compose up -d

# 3. Install dependencies
npm install

# 4. Run database migrations
npx prisma migrate dev --name init

# 5. Seed the database
npx prisma db seed

# 6. Start the development server
npm run dev
```

## Login Credentials

| Email                        | Password  | Role     |
|------------------------------|-----------|----------|
| admin@dronetest.internal     | admin123  | ADMIN    |
| qa@dronetest.internal        | qa123     | QA       |
| eng1@dronetest.internal      | eng123    | ENGINEER |
| eng2@dronetest.internal      | eng123    | ENGINEER |
| manager@dronetest.internal   | mgr123   | MANAGER  |

## URLs

| Service   | URL                          |
|-----------|------------------------------|
| App       | http://localhost:3000         |
| pgAdmin   | http://localhost:5050         |

pgAdmin login: `admin@dronetest.internal` / `admin123`

## Role Permissions

| Action                          | ADMIN | QA | ENGINEER | MANAGER |
|---------------------------------|:-----:|:--:|:--------:|:-------:|
| Master Dashboard                |  Yes  | Yes|    No    |   Yes   |
| View all pages                  |  Yes  | Yes|   Yes    |   Yes   |
| Create/edit test cases & plans  |  Yes  | Yes|    No    | Read-only|
| Create test runs                |  Yes  | Yes|   Yes    |    No   |
| Create/update issues            |  Yes  | Yes| Own only |    No   |
| Conclude tests                  |  Yes  | Yes|    No    |    No   |
| Create archives                 |  Yes  | Yes|    No    |    No   |

## How to Fork a Test

1. Navigate to a test case detail page
2. Click "Fork this test"
3. Enter a fork reason and optionally override parameters
4. The fork inherits all parent fields with `forkDepth + 1`
5. View the full fork tree at `/test-cases/[id]/forks`
6. Compare two forks side-by-side by selecting them in the tree

## How to Conclude and Archive

1. Run all test cases in a test plan
2. On each test case detail page, click "Conclude this test"
   - Mark one fork as "canonical" if applicable
   - All sibling forks lose canonical status when one is marked
3. When all test cases in a plan are concluded, the plan status updates automatically
4. Navigate to the test plan and click "Conclude Plan" to create an archive
5. Archives are immutable and include all findings, test results, and fork history

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database**: PostgreSQL 15 via Docker
- **ORM**: Prisma 5.22.0
- **Styling**: TailwindCSS
- **Auth**: NextAuth.js v4 (credentials, JWT, role-based)
- **Charts**: Recharts
- **Validation**: Zod
- **Forms**: React Hook Form

## Phase 2 Roadmap

- **GitHub Webhooks**: POST `/api/webhooks/github` — receives GitHub events, auto-creates test plans from templates
- **GitHub Status API**: Push test results back to GitHub on archive creation
- **PDF Export**: Generate downloadable PDF reports from archives
- **Email Notifications**: Notify assignees on issue creation, test plan conclusion, and overdue tests
