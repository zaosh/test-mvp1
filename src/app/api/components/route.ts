import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole, isNextResponse } from '@/lib/roles'
import { writeAuditLog } from '@/lib/audit'
import { ComponentCreateSchema } from '@/lib/sanitize'

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'QA', 'ENGINEER', 'MANAGER'])
  if (isNextResponse(auth)) return auth

  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const pageParam = searchParams.get('page')
    const pageSizeParam = searchParams.get('pageSize')

    if (pageParam) {
      const page = Math.max(1, parseInt(pageParam) || 1)
      const pageSize = Math.min(100, Math.max(1, parseInt(pageSizeParam || '20') || 20))

      const [components, total] = await Promise.all([
        prisma.component.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.component.count({ where }),
      ])

      return NextResponse.json({ data: components, total, page, pageSize })
    }

    const components = await prisma.component.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(components)
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'QA'])
  if (isNextResponse(auth)) return auth

  try {
    const body = await req.json()
    const parsed = ComponentCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const component = await prisma.component.create({ data: parsed.data })

    await writeAuditLog({
      action: 'CREATE',
      entityType: 'Component',
      entityId: component.id,
      userId: auth.user.id,
      after: { name: component.name, type: component.type },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json(component, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
