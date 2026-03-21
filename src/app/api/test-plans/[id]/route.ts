import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole, isNextResponse } from '@/lib/roles'
import { writeAuditLog } from '@/lib/audit'
import { TestPlanUpdateSchema } from '@/lib/sanitize'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, ['ADMIN', 'QA', 'ENGINEER', 'MANAGER'])
  if (isNextResponse(auth)) return auth

  try {
    const testPlan = await prisma.testPlan.findUnique({
      where: { id: params.id },
      include: {
        testCases: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
            component: { select: { id: true, name: true } },
            _count: { select: { testRuns: true } },
          },
        },
        githubRef: true,
        archive: true,
      },
    })

    if (!testPlan) {
      return NextResponse.json({ error: 'Test plan not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json(testPlan)
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, ['ADMIN', 'QA'])
  if (isNextResponse(auth)) return auth

  try {
    const body = await req.json()
    const parsed = TestPlanUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { startDate, targetDate, ...rest } = parsed.data

    const testPlan = await prisma.testPlan.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(targetDate !== undefined && { targetDate: targetDate ? new Date(targetDate) : null }),
      },
      include: { githubRef: true },
    })

    await writeAuditLog({
      action: 'UPDATE',
      entityType: 'TestPlan',
      entityId: testPlan.id,
      userId: auth.user.id,
      after: rest as Record<string, unknown>,
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json(testPlan)
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, ['ADMIN'])
  if (isNextResponse(auth)) return auth

  try {
    await writeAuditLog({
      action: 'DELETE',
      entityType: 'TestPlan',
      entityId: params.id,
      userId: auth.user.id,
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    await prisma.testPlan.delete({ where: { id: params.id } })

    return NextResponse.json({ message: 'Test plan deleted' })
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
