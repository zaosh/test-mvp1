import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole, isNextResponse } from '@/lib/roles'
import { writeAuditLog } from '@/lib/audit'
import { TestCaseCreateSchema, GitHubRefSchema } from '@/lib/sanitize'
import { z } from 'zod'

const CreateWithRefSchema = TestCaseCreateSchema.extend({
  githubRef: GitHubRefSchema.optional(),
})

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'QA', 'ENGINEER', 'MANAGER'])
  if (isNextResponse(auth)) return auth

  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const componentId = searchParams.get('componentId')
    const ownerId = searchParams.get('ownerId')
    const testPlanId = searchParams.get('testPlanId')
    const hasForksOnly = searchParams.get('hasForksOnly')

    const where: Record<string, unknown> = {}
    if (type) where.testType = type
    if (status) where.status = status
    if (componentId) where.componentId = componentId
    if (ownerId) where.ownerId = ownerId
    if (testPlanId) where.testPlanId = testPlanId
    if (hasForksOnly === 'true') where.forks = { some: {} }

    // Visibility enforcement
    if (auth.user.role === 'ENGINEER') {
      where.OR = [
        { visibility: 'PUBLIC' },
        { visibility: 'TEAM' },
        { ownerId: auth.user.id },
      ]
    }

    const pageParam = searchParams.get('page')
    const pageSizeParam = searchParams.get('pageSize')

    const include = {
      owner: { select: { id: true, name: true, email: true } },
      component: { select: { id: true, name: true } },
      _count: { select: { testRuns: true, forks: true } },
      parent: { select: { id: true, title: true } },
    }

    if (pageParam) {
      const page = Math.max(1, parseInt(pageParam) || 1)
      const pageSize = Math.min(100, Math.max(1, parseInt(pageSizeParam || '20') || 20))

      const [testCases, total] = await Promise.all([
        prisma.testCase.findMany({
          where,
          include,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.testCase.count({ where }),
      ])

      return NextResponse.json({ data: testCases, total, page, pageSize })
    }

    const testCases = await prisma.testCase.findMany({
      where,
      include,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(testCases)
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

    const { githubRef, nextDueDate, ...caseData } = parsed.data

    const testCase = await prisma.testCase.create({
      data: {
        ...caseData,
        ownerId: auth.user.id,
        nextDueDate: nextDueDate ? new Date(nextDueDate) : undefined,
        ...(githubRef && { githubRef: { create: githubRef } }),
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        component: { select: { id: true, name: true } },
      },
    })

    await writeAuditLog({
      action: 'CREATE',
      entityType: 'TestCase',
      entityId: testCase.id,
      userId: auth.user.id,
      after: { title: testCase.title, testType: testCase.testType },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json(testCase, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
