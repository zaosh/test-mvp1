import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole, isNextResponse } from '@/lib/roles'

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'QA', 'MANAGER'])
  if (isNextResponse(auth)) return auth

  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalActiveTests, passedThisMonth, openIssues, overdueTests] = await Promise.all([
      prisma.testCase.count({
        where: { status: { notIn: ['CONCLUDED', 'WAIVED', 'DRAFT'] } },
      }),
      prisma.testRun.count({
        where: { status: 'PASSED', runDate: { gte: startOfMonth } },
      }),
      prisma.issue.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      prisma.testCase.count({
        where: { nextDueDate: { lt: now }, status: { not: 'CONCLUDED' } },
      }),
    ])

    return NextResponse.json({ totalActiveTests, passedThisMonth, openIssues, overdueTests })
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
