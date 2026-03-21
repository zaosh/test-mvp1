import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole, isNextResponse } from '@/lib/roles'
import { writeAuditLog } from '@/lib/audit'
import { TestRunCreateSchema } from '@/lib/sanitize'

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'QA', 'ENGINEER', 'MANAGER'])
  if (isNextResponse(auth)) return auth

  try {
    const { searchParams } = new URL(req.url)
    const testCaseId = searchParams.get('testCaseId')
    const componentId = searchParams.get('componentId')
    const status = searchParams.get('status')
    const loggedById = searchParams.get('loggedById')
    const environment = searchParams.get('environment')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: Record<string, unknown> = {}
    if (testCaseId) where.testCaseId = testCaseId
    if (componentId) where.componentId = componentId
    if (status) where.status = status
    if (loggedById) where.loggedById = loggedById
    if (environment) where.environment = environment
    if (dateFrom || dateTo) {
      const runDate: Record<string, Date> = {}
      if (dateFrom) runDate.gte = new Date(dateFrom)
      if (dateTo) runDate.lte = new Date(dateTo)
      where.runDate = runDate
    }

    const pageParam = searchParams.get('page')
    const pageSizeParam = searchParams.get('pageSize')

    const include = {
      testCase: { select: { id: true, title: true, testType: true } },
      component: { select: { id: true, name: true } },
      loggedBy: { select: { id: true, name: true } },
      _count: { select: { issues: true } },
    }

    if (pageParam) {
      const page = Math.max(1, parseInt(pageParam) || 1)
      const pageSize = Math.min(100, Math.max(1, parseInt(pageSizeParam || '20') || 20))

      const [testRuns, total] = await Promise.all([
        prisma.testRun.findMany({
          where,
          include,
          orderBy: { runDate: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.testRun.count({ where }),
      ])

      return NextResponse.json({ data: testRuns, total, page, pageSize })
    }

    const testRuns = await prisma.testRun.findMany({
      where,
      include,
      orderBy: { runDate: 'desc' },
    })

    return NextResponse.json(testRuns)
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'QA', 'ENGINEER'])
  if (isNextResponse(auth)) return auth

  try {
    const body = await req.json()
    const parsed = TestRunCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { measuredValues, flightData, weatherData, ...runData } = parsed.data
    const testRun = await prisma.testRun.create({
      data: {
        ...runData,
        loggedById: auth.user.id,
        runDate: new Date(),
        ...(measuredValues && { measuredValues: measuredValues as any }),
        ...(flightData && { flightData: flightData as any }),
        ...(weatherData && { weatherData: weatherData as any }),
      },
      include: {
        testCase: { select: { id: true, title: true, testType: true } },
        component: { select: { id: true, name: true } },
        loggedBy: { select: { id: true, name: true } },
      },
    })

    await writeAuditLog({
      action: 'CREATE',
      entityType: 'TestRun',
      entityId: testRun.id,
      userId: auth.user.id,
      after: { testCaseId: testRun.testCaseId, status: testRun.status },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json(testRun, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
