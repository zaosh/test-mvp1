import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole, isNextResponse } from '@/lib/roles'

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'QA', 'MANAGER'])
  if (isNextResponse(auth)) return auth

  try {
    // Use AuditLog for activity feed
    const auditLogs = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { name: true } },
      },
    })

    if (auditLogs.length > 0) {
      const activities = auditLogs.map((log) => ({
        type: log.entityType.toLowerCase(),
        action: log.action,
        entityId: log.entityId,
        user: log.user?.name ?? 'System',
        date: log.timestamp,
      }))
      return NextResponse.json(activities)
    }

    // Fallback: merge recent entities if no audit logs yet
    const [recentTestRuns, recentIssues, recentArchives] = await Promise.all([
      prisma.testRun.findMany({
        take: 10,
        orderBy: { runDate: 'desc' },
        include: {
          testCase: { select: { title: true } },
          loggedBy: { select: { name: true } },
        },
      }),
      prisma.issue.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { name: true } } },
      }),
      prisma.archive.findMany({
        take: 10,
        orderBy: { archivedAt: 'desc' },
        include: { archivedBy: { select: { name: true } } },
      }),
    ])

    const activities: Array<{
      type: string
      title: string
      user: string
      date: Date
      status?: string
    }> = []

    for (const run of recentTestRuns) {
      activities.push({
        type: 'test_run',
        title: run.testCase?.title || `Test Run ${run.id}`,
        user: run.loggedBy?.name || 'Unknown',
        date: run.runDate,
        status: run.status,
      })
    }

    for (const issue of recentIssues) {
      activities.push({
        type: 'issue',
        title: issue.title,
        user: issue.createdBy?.name || 'Unknown',
        date: issue.createdAt,
        status: issue.status,
      })
    }

    for (const archive of recentArchives) {
      activities.push({
        type: 'archive',
        title: archive.title,
        user: archive.archivedBy?.name || 'Unknown',
        date: archive.archivedAt,
      })
    }

    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json(activities.slice(0, 10))
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
