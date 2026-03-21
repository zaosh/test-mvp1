import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole, isNextResponse } from '@/lib/roles'
import { writeAuditLog } from '@/lib/audit'
import { ArchiveCreateSchema } from '@/lib/sanitize'

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'QA', 'ENGINEER', 'MANAGER'])
  if (isNextResponse(auth)) return auth

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const outcome = searchParams.get('outcome')
    const tag = searchParams.get('tag')
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') ?? '20', 10), 100)

    // If search param exists, use tsvector full text search
    if (search) {
      // Sanitize search input: strip special chars
      const sanitizedSearch = search.replace(/[^\w\s.-]/g, '').trim()
      if (!sanitizedSearch) {
        return NextResponse.json([])
      }

      const archives = await prisma.$queryRaw`
        SELECT a.*, u.name as "archivedByName"
        FROM "Archive" a
        LEFT JOIN "User" u ON a."archivedById" = u.id
        WHERE to_tsvector('english', a."searchIndex")
          @@ plainto_tsquery('english', ${sanitizedSearch})
        ORDER BY a."archivedAt" DESC
        LIMIT ${pageSize}
        OFFSET ${(page - 1) * pageSize}
      `

      return NextResponse.json(archives)
    }

    const where: Record<string, unknown> = {}
    if (category) where.category = category
    if (outcome) where.outcome = outcome
    if (tag) where.tags = { has: tag }

    const archives = await prisma.archive.findMany({
      where,
      include: {
        archivedBy: { select: { id: true, name: true } },
        testPlan: { select: { id: true, title: true } },
        _count: { select: { testCases: true } },
      },
      orderBy: { archivedAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    })

    return NextResponse.json(archives)
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'QA'])
  if (isNextResponse(auth)) return auth

  try {
    const body = await req.json()
    const parsed = ArchiveCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { testPlanId, testCaseIds, findings, ...rest } = parsed.data

    // Build searchIndex
    const findingDescriptions = findings.map((f) => f.description).join(' ')
    const searchIndex = [rest.title, rest.summary, findingDescriptions].filter(Boolean).join(' ')

    const archiveData: Record<string, unknown> = {
      ...rest,
      findings,
      searchIndex,
      archivedById: auth.user.id,
      archivedAt: new Date(),
      attachments: [],
      tags: rest.tags ?? [],
    }

    if (testPlanId) {
      archiveData.testPlanId = testPlanId

      // Collect all test cases in the plan (including forks at all depths)
      const planTestCases = await prisma.testCase.findMany({
        where: { testPlanId },
        select: { id: true, isCanonical: true },
      })

      const archive = await prisma.$transaction(async (tx) => {
        const created = await tx.archive.create({
          data: {
            ...(archiveData as any),
            testCases: {
              create: planTestCases.map((tc) => ({
                testCaseId: tc.id,
                wasCanonical: tc.isCanonical,
              })),
            },
          },
          include: {
            archivedBy: { select: { id: true, name: true } },
            testPlan: { select: { id: true, title: true } },
            _count: { select: { testCases: true } },
          },
        })

        // Set plan status to CONCLUDED
        await tx.testPlan.update({
          where: { id: testPlanId },
          data: { status: 'CONCLUDED', concludedAt: new Date() },
        })

        return created
      })

      await writeAuditLog({
        action: 'ARCHIVE',
        entityType: 'Archive',
        entityId: archive.id,
        userId: auth.user.id,
        after: { title: archive.title, testPlanId, category: archive.category },
        ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
      })

      return NextResponse.json(archive, { status: 201 })
    }

    // Archive without a test plan
    const archive = await prisma.archive.create({
      data: {
        ...(archiveData as any),
        ...(testCaseIds && {
          testCases: {
            create: testCaseIds.map((id) => ({ testCaseId: id })),
          },
        }),
      },
      include: {
        archivedBy: { select: { id: true, name: true } },
        testPlan: { select: { id: true, title: true } },
        _count: { select: { testCases: true } },
      },
    })

    await writeAuditLog({
      action: 'ARCHIVE',
      entityType: 'Archive',
      entityId: archive.id,
      userId: auth.user.id,
      after: { title: archive.title, category: archive.category },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json(archive, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
