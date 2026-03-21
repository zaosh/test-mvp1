import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole, isNextResponse } from '@/lib/roles'
import { writeAuditLog } from '@/lib/audit'
import { ForkCreateSchema } from '@/lib/sanitize'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, ['ADMIN', 'QA', 'ENGINEER'])
  if (isNextResponse(auth)) return auth

  try {
    const body = await req.json()
    const parsed = ForkCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { forkReason, overrideParameters, overrideTitle } = parsed.data

    const parent = await prisma.testCase.findUnique({
      where: { id: params.id },
    })

    if (!parent) {
      return NextResponse.json({ error: 'Parent test case not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    // ENGINEER can only fork own cases
    if (auth.user.role === 'ENGINEER' && parent.ownerId !== auth.user.id) {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
    }

    // Fork depth limit
    if (parent.forkDepth >= 5) {
      return NextResponse.json(
        { error: 'Maximum fork depth reached (5 levels)', code: 'FORK_DEPTH_EXCEEDED' },
        { status: 400 }
      )
    }

    const parentParams = parent.parameters as Record<string, unknown> | null
    const mergedParameters = overrideParameters
      ? { ...(parentParams ?? {}), ...overrideParameters }
      : parent.parameters

    const title = overrideTitle || `${parent.title} (Fork: ${forkReason.slice(0, 50)})`

    const fork = await prisma.testCase.create({
      data: {
        title,
        objective: parent.objective,
        testType: parent.testType,
        visibility: parent.visibility,
        parameters: (mergedParameters ?? {}) as any,
        passCriteria: parent.passCriteria,
        steps: parent.steps as any,
        componentId: parent.componentId,
        testPlanId: parent.testPlanId,
        frequency: parent.frequency,
        parentId: parent.id,
        forkDepth: parent.forkDepth + 1,
        forkReason,
        status: 'DRAFT',
        isCanonical: false,
        ownerId: auth.user.id,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        parent: { select: { id: true, title: true } },
        component: { select: { id: true, name: true } },
      },
    })

    await writeAuditLog({
      action: 'FORK',
      entityType: 'TestCase',
      entityId: fork.id,
      userId: auth.user.id,
      after: { parentId: parent.id, forkReason, forkDepth: fork.forkDepth },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json(fork, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
