import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { writeAuditLog } from '@/lib/audit'

export type Role = 'ADMIN' | 'QA' | 'ENGINEER' | 'MANAGER'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role
  mustChangePassword: boolean
  sessionVersion: number
}

// MVP: Auth disabled — use mock session based on x-testlab-mode header or cookie
// When auth is re-enabled, remove this and the bypass in requireRole()
const MOCK_USERS: Record<string, SessionUser> = {
  admin: {
    id: 'mock-admin',
    name: 'Admin',
    email: 'admin@testlab.internal',
    role: 'ADMIN',
    mustChangePassword: false,
    sessionVersion: 1,
  },
  testing: {
    id: 'mock-qa',
    name: 'QA Engineer',
    email: 'qa@testlab.internal',
    role: 'QA',
    mustChangePassword: false,
    sessionVersion: 1,
  },
  dev: {
    id: 'mock-dev',
    name: 'Developer',
    email: 'dev@testlab.internal',
    role: 'ENGINEER',
    mustChangePassword: false,
    sessionVersion: 1,
  },
}

function getMockUser(req: Request): SessionUser {
  // Check header first, then fall back to admin
  const mode = req.headers.get('x-testlab-mode') ?? 'admin'
  return MOCK_USERS[mode] ?? MOCK_USERS.admin
}

export const PERMISSIONS = {
  DASHBOARD_ACCESS: ['ADMIN', 'QA', 'MANAGER'] as Role[],
  MANAGE_TEST_CASES: ['ADMIN', 'QA'] as Role[],
  MANAGE_TEST_PLANS: ['ADMIN', 'QA'] as Role[],
  CREATE_TEST_RUNS: ['ADMIN', 'QA', 'ENGINEER'] as Role[],
  MANAGE_ISSUES: ['ADMIN', 'QA', 'ENGINEER'] as Role[],
  CREATE_ARCHIVES: ['ADMIN', 'QA'] as Role[],
  CONCLUDE_TESTS: ['ADMIN', 'QA'] as Role[],
  FORK_TESTS: ['ADMIN', 'QA', 'ENGINEER'] as Role[],
  READ_ALL: ['ADMIN', 'QA', 'MANAGER'] as Role[],
  WRITE_ALL: ['ADMIN', 'QA'] as Role[],
} as const

export function hasPermission(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole)
}

export async function requireRole(
  req: Request,
  allowedRoles: Role[]
): Promise<{ user: SessionUser } | NextResponse> {
  // MVP: Auth disabled — use mock user, skip real session check
  // To re-enable auth: remove this block and uncomment the getServerSession block below
  const user = getMockUser(req)

  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  return { user }

  /* AUTH ENABLED (re-enable when login is restored):
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const user = session.user as SessionUser

  if (!allowedRoles.includes(user.role)) {
    await writeAuditLog({
      action: 'UPDATE',
      userId: user.id,
      entityType: 'API',
      entityId: req.url,
      ipAddress: req.headers.get('x-forwarded-for') ?? 'unknown',
      after: { attemptedRole: user.role, requiredRoles: allowedRoles },
    })
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  return { user }
  */
}

export function isNextResponse(result: { user: SessionUser } | NextResponse): result is NextResponse {
  return result instanceof NextResponse
}
