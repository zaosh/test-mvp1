import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole, isNextResponse } from '@/lib/roles'

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'QA', 'MANAGER'])
  if (isNextResponse(auth)) return auth

  try {
    const now = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(now.getDate() - 30)

    const testRuns = await prisma.testRun.findMany({
      where: { runDate: { gte: thirtyDaysAgo } },
      select: { runDate: true, status: true },
      orderBy: { runDate: 'asc' },
    })

    const dailyMap = new Map<string, { total: number; passed: number; failed: number }>()

    for (let i = 0; i < 30; i++) {
      const d = new Date()
      d.setDate(now.getDate() - 29 + i)
      const key = d.toISOString().split('T')[0]
      dailyMap.set(key, { total: 0, passed: 0, failed: 0 })
    }

    for (const run of testRuns) {
      const key = run.runDate.toISOString().split('T')[0]
      const entry = dailyMap.get(key)
      if (entry) {
        entry.total++
        if (run.status === 'PASSED') entry.passed++
        if (run.status === 'FAILED') entry.failed++
      }
    }

    const trend = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      total: data.total,
      passed: data.passed,
      failed: data.failed,
      failureRate: data.total > 0 ? Math.round((data.failed / data.total) * 100 * 100) / 100 : 0,
    }))

    return NextResponse.json(trend)
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
