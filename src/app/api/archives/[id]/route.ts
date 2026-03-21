import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole, isNextResponse } from '@/lib/roles'

// GET only — no PUT, no DELETE. Archives are immutable.

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, ['ADMIN', 'QA', 'ENGINEER', 'MANAGER'])
  if (isNextResponse(auth)) return auth

  try {
    const archive = await prisma.archive.findUnique({
      where: { id: params.id },
      include: {
        testPlan: true,
        archivedBy: { select: { id: true, name: true, email: true } },
        testCases: {
          include: {
            testCase: {
              include: {
                owner: { select: { id: true, name: true } },
                component: { select: { id: true, name: true } },
                _count: { select: { testRuns: true } },
              },
            },
          },
        },
      },
    })

    if (!archive) {
      return NextResponse.json({ error: 'Archive not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json(archive)
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
