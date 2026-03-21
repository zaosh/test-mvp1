import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole, isNextResponse } from '@/lib/roles'
import { writeAuditLog } from '@/lib/audit'
import { z } from 'zod'
import { MeasuredValuesSchema } from '@/lib/sanitize'

const UpdateTestRunSchema = z.object({
  environment: z.enum(['LAB', 'FIELD', 'SIMULATION', 'BENCH']).optional(),
  status: z.enum(['PASSED', 'FAILED', 'IN_PROGRESS', 'BLOCKED']).optional(),
  notes: z.string().max(5000).optional().nullable(),
  measuredValues: MeasuredValuesSchema.optional(),
  flightData: z.record(z.string(), z.unknown()).optional(),
  weatherData: z.record(z.string(), z.unknown()).optional(),
  location: z.string().max(500).optional().nullable(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, ['ADMIN', 'QA', 'ENGINEER', 'MANAGER'])
  if (isNextResponse(auth)) return auth

  try {
    const testRun = await prisma.testRun.findUnique({
      where: { id: params.id },
      include: {
        testCase: true,
        component: true,
        loggedBy: { select: { id: true, name: true, email: true } },
        attachments: true,
        issues: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    if (!testRun) {
      return NextResponse.json({ error: 'Test run not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json(testRun)
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
    // ENGINEER can only update own runs
    if (auth.user.role === 'ENGINEER') {
      const existing = await prisma.testRun.findUnique({
        where: { id: params.id },
        select: { loggedById: true },
      })
      if (!existing) {
        return NextResponse.json({ error: 'Test run not found', code: 'NOT_FOUND' }, { status: 404 })
      }
      if (existing.loggedById !== auth.user.id) {
        return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
      }
    }

    const body = await req.json()
    const parsed = UpdateTestRunSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { measuredValues, flightData, weatherData, ...runData } = parsed.data
    const testRun = await prisma.testRun.update({
      where: { id: params.id },
      data: {
        ...runData,
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
      action: 'UPDATE',
      entityType: 'TestRun',
      entityId: testRun.id,
      userId: auth.user.id,
      after: parsed.data as Record<string, unknown>,
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json(testRun)
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, ['ADMIN', 'QA'])
  if (isNextResponse(auth)) return auth

  try {
    const existing = await prisma.testRun.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Test run not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    await prisma.testRun.delete({ where: { id: params.id } })

    await writeAuditLog({
      action: 'DELETE',
      entityType: 'TestRun',
      entityId: params.id,
      userId: auth.user.id,
      before: { testCaseId: existing.testCaseId, status: existing.status },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
