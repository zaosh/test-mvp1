import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole, isNextResponse } from '@/lib/roles'
import { writeAuditLog } from '@/lib/audit'
import { IssueCreateSchema } from '@/lib/sanitize'

const severityOrder: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
}

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'QA', 'ENGINEER', 'MANAGER'])
  if (isNextResponse(auth)) return auth

  try {
    const { searchParams } = new URL(req.url)
    const severity = searchParams.get('severity')
    const status = searchParams.get('status')
    const assigneeId = searchParams.get('assigneeId')
    const componentId = searchParams.get('componentId')
    const testRunId = searchParams.get('testRunId')

    const where: Record<string, unknown> = {}
    if (severity) where.severity = severity
    if (status) where.status = status
    if (assigneeId) where.assigneeId = assigneeId
    if (componentId) where.componentId = componentId
    if (testRunId) where.testRunId = testRunId

    const pageParam = searchParams.get('page')
    const pageSizeParam = searchParams.get('pageSize')

    const include = {
      testRun: {
        select: { id: true, testCase: { select: { title: true } } },
      },
      component: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    }

    const sortResult = (items: any[]) => {
      items.sort((a, b) => {
        const sevA = severityOrder[a.severity] ?? 99
        const sevB = severityOrder[b.severity] ?? 99
        if (sevA !== sevB) return sevA - sevB
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      return items
    }

    if (pageParam) {
      const page = Math.max(1, parseInt(pageParam) || 1)
      const pageSize = Math.min(100, Math.max(1, parseInt(pageSizeParam || '20') || 20))

      const [issues, total] = await Promise.all([
        prisma.issue.findMany({
          where,
          include,
          orderBy: [{ createdAt: 'desc' }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.issue.count({ where }),
      ])

      return NextResponse.json({ data: sortResult(issues), total, page, pageSize })
    }

    const issues = await prisma.issue.findMany({
      where,
      include,
      orderBy: [{ createdAt: 'desc' }],
    })

    return NextResponse.json(sortResult(issues))
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'QA', 'ENGINEER'])
  if (isNextResponse(auth)) return auth

  try {
    const body = await req.json()
    const parsed = IssueCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const issue = await prisma.issue.create({
      data: {
        ...parsed.data,
        createdById: auth.user.id,
      },
      include: {
        testRun: { select: { id: true, testCase: { select: { title: true } } } },
        component: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    })

    await writeAuditLog({
      action: 'CREATE',
      entityType: 'Issue',
      entityId: issue.id,
      userId: auth.user.id,
      after: { title: issue.title, severity: issue.severity },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json(issue, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
