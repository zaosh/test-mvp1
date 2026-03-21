import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole, isNextResponse } from '@/lib/roles'
import { writeAuditLog } from '@/lib/audit'
import { TestPlanCreateSchema, GitHubRefSchema } from '@/lib/sanitize'

const CreateWithRefSchema = TestPlanCreateSchema.extend({
  githubRef: GitHubRefSchema.optional(),
})

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'QA', 'ENGINEER', 'MANAGER'])
  if (isNextResponse(auth)) return auth

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const pageParam = searchParams.get('page')
    const pageSizeParam = searchParams.get('pageSize')

    const include = {
      _count: { select: { testCases: true } },
      githubRef: true,
    }

    if (pageParam) {
      const page = Math.max(1, parseInt(pageParam) || 1)
      const pageSize = Math.min(100, Math.max(1, parseInt(pageSizeParam || '20') || 20))

      const [testPlans, total] = await Promise.all([
        prisma.testPlan.findMany({
          where,
          include,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.testPlan.count({ where }),
      ])

      return NextResponse.json({ data: testPlans, total, page, pageSize })
    }

    const testPlans = await prisma.testPlan.findMany({
      where,
      include,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(testPlans)
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'QA'])
  if (isNextResponse(auth)) return auth

  try {
    const body = await req.json()
    const parsed = CreateWithRefSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { githubRef, startDate, targetDate, ...planData } = parsed.data

    const testPlan = await prisma.testPlan.create({
      data: {
        ...planData,
        startDate: startDate ? new Date(startDate) : undefined,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        ...(githubRef && { githubRef: { create: githubRef } }),
      },
      include: { githubRef: true },
    })

    await writeAuditLog({
      action: 'CREATE',
      entityType: 'TestPlan',
      entityId: testPlan.id,
      userId: auth.user.id,
      after: { title: testPlan.title },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json(testPlan, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
