import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole, isNextResponse } from '@/lib/roles'
import { writeAuditLog } from '@/lib/audit'
import { TestCaseUpdateSchema } from '@/lib/sanitize'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, ['ADMIN', 'QA', 'ENGINEER', 'MANAGER'])
  if (isNextResponse(auth)) return auth

  try {
    const testCase = await prisma.testCase.findUnique({
      where: { id: params.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        component: true,
        testPlan: true,
        parent: { select: { id: true, title: true } },
        forks: {
          select: {
            id: true, title: true, status: true, forkDepth: true,
            forkReason: true, isCanonical: true, parameters: true,
            owner: { select: { id: true, name: true } },
          },
        },
        githubRef: true,
        testRuns: {
          take: 5,
          orderBy: { runDate: 'desc' },
          include: { loggedBy: { select: { id: true, name: true } } },
        },
        archiveEntries: true,
      },
    })

    if (!testCase) {
      return NextResponse.json({ error: 'Test case not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    // Visibility enforcement
    if (testCase.visibility === 'RESTRICTED') {
      if (!['ADMIN', 'QA'].includes(auth.user.role) && testCase.ownerId !== auth.user.id) {
        return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
      }
    }

    return NextResponse.json(testCase)
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, ['ADMIN', 'QA', 'ENGINEER'])
  if (isNextResponse(auth)) return auth

  try {
    // ENGINEER can only edit own cases
    if (auth.user.role === 'ENGINEER') {
      const existing = await prisma.testCase.findUnique({
        where: { id: params.id },
        select: { ownerId: true },
      })
      if (!existing) {
        return NextResponse.json({ error: 'Test case not found', code: 'NOT_FOUND' }, { status: 404 })
      }
      if (existing.ownerId !== auth.user.id) {
        return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
      }
    }

    const body = await req.json()
    const parsed = TestCaseUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { nextDueDate, ...rest } = parsed.data

    const testCase = await prisma.testCase.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(nextDueDate !== undefined && {
          nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
        }),
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        component: { select: { id: true, name: true } },
      },
    })

    await writeAuditLog({
      action: 'UPDATE',
      entityType: 'TestCase',
      entityId: testCase.id,
      userId: auth.user.id,
      after: rest as Record<string, unknown>,
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json(testCase)
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
      entityType: 'TestCase',
      entityId: params.id,
      userId: auth.user.id,
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    await prisma.testCase.delete({ where: { id: params.id } })

    return NextResponse.json({ message: 'Test case deleted' })
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
