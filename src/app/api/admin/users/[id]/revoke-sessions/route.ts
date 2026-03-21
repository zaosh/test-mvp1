import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole, isNextResponse } from '@/lib/roles'
import { writeAuditLog } from '@/lib/audit'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, ['ADMIN'])
  if (isNextResponse(auth)) return auth

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, name: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    await prisma.user.update({
      where: { id: params.id },
      data: { sessionVersion: { increment: 1 } },
    })

    await writeAuditLog({
      action: 'ACCOUNT_LOCKED',
      entityType: 'User',
      entityId: params.id,
      userId: auth.user.id,
      after: { action: 'sessions_revoked', targetUser: user.name },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json({ message: 'All sessions revoked' })
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
