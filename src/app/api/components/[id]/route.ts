import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole, isNextResponse } from '@/lib/roles'
import { writeAuditLog } from '@/lib/audit'
import { ComponentUpdateSchema } from '@/lib/sanitize'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, ['ADMIN', 'QA', 'ENGINEER', 'MANAGER'])
  if (isNextResponse(auth)) return auth

  try {
    const component = await prisma.component.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { testCases: true, testRuns: true, issues: true } },
      },
    })

    if (!component) {
      return NextResponse.json({ error: 'Component not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json(component)
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
    const parsed = ComponentUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const component = await prisma.component.update({
      where: { id: params.id },
      data: parsed.data,
    })

    await writeAuditLog({
      action: 'UPDATE',
      entityType: 'Component',
      entityId: component.id,
      userId: auth.user.id,
      after: parsed.data as Record<string, unknown>,
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json(component)
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
      entityType: 'Component',
      entityId: params.id,
      userId: auth.user.id,
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    await prisma.component.delete({ where: { id: params.id } })

    return NextResponse.json({ message: 'Component deleted' })
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
