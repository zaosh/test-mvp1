import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole, isNextResponse } from '@/lib/roles'
import { writeAuditLog } from '@/lib/audit'
import { ConcludeSchema } from '@/lib/sanitize'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, ['ADMIN', 'QA'])
  if (isNextResponse(auth)) return auth

  try {
    const body = await req.json()
    const parsed = ConcludeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { concludedNotes, isCanonical } = parsed.data

    const testCase = await prisma.testCase.findUnique({
      where: { id: params.id },
      select: { id: true, parentId: true, testPlanId: true },
    })

    if (!testCase) {
      return NextResponse.json({ error: 'Test case not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    // Use transaction to ensure atomicity
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.testCase.update({
        where: { id: params.id },
        data: {
          status: 'CONCLUDED',
          concludedAt: new Date(),
          concludedById: auth.user.id,
          concludedNotes,
          ...(isCanonical && { isCanonical: true }),
        },
        include: {
          owner: { select: { id: true, name: true } },
        },
      })

      // If isCanonical, clear all sibling forks
      if (isCanonical && testCase.parentId) {
        await tx.testCase.updateMany({
          where: {
            parentId: testCase.parentId,
            id: { not: params.id },
          },
          data: { isCanonical: false },
        })
      }

      // Check if all cases in test plan are concluded or waived
      if (testCase.testPlanId) {
        const nonConcludedCount = await tx.testCase.count({
          where: {
            testPlanId: testCase.testPlanId,
            status: { notIn: ['CONCLUDED', 'WAIVED'] },
          },
        })

        if (nonConcludedCount === 0) {
          await tx.testPlan.update({
            where: { id: testCase.testPlanId },
            data: { status: 'CONCLUDED' },
          })
        }
      }

      return result
    })

    await writeAuditLog({
      action: 'CONCLUDE',
      entityType: 'TestCase',
      entityId: params.id,
      userId: auth.user.id,
      after: { concludedNotes, isCanonical: isCanonical ?? false },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
