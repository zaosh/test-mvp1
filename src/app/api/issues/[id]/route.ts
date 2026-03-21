import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole, isNextResponse } from '@/lib/roles'
import { writeAuditLog } from '@/lib/audit'
import { IssueUpdateSchema } from '@/lib/sanitize'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, ['ADMIN', 'QA', 'ENGINEER', 'MANAGER'])
  if (isNextResponse(auth)) return auth

  try {
    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
      include: {
        testRun: { include: { testCase: true } },
        component: true,
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json(issue)
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
    // ENGINEER can only update own assigned issues
    if (auth.user.role === 'ENGINEER') {
      const existing = await prisma.issue.findUnique({
        where: { id: params.id },
        select: { assigneeId: true, createdById: true },
      })
      if (!existing) {
        return NextResponse.json({ error: 'Issue not found', code: 'NOT_FOUND' }, { status: 404 })
      }
      if (existing.assigneeId !== auth.user.id && existing.createdById !== auth.user.id) {
        return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
      }
    }

    const body = await req.json()
    const parsed = IssueUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { status, ...rest } = parsed.data
    const updateData: Record<string, unknown> = { ...rest }

    if (status) {
      updateData.status = status
      if (status === 'RESOLVED') {
        if (!parsed.data.resolutionNotes) {
          return NextResponse.json(
            { error: 'Resolution notes required to resolve an issue', code: 'VALIDATION_ERROR' },
            { status: 400 }
          )
        }
        updateData.resolvedAt = new Date()
      }
    }

    const issue = await prisma.issue.update({
      where: { id: params.id },
      data: updateData,
      include: {
        testRun: { select: { id: true, testCase: { select: { title: true } } } },
        component: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    })

    await writeAuditLog({
      action: 'UPDATE',
      entityType: 'Issue',
      entityId: issue.id,
      userId: auth.user.id,
      after: parsed.data as Record<string, unknown>,
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json(issue)
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
    const existing = await prisma.issue.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Issue not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    await prisma.issue.delete({ where: { id: params.id } })

    await writeAuditLog({
      action: 'DELETE',
      entityType: 'Issue',
      entityId: params.id,
      userId: auth.user.id,
      before: { title: existing.title, severity: existing.severity },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
