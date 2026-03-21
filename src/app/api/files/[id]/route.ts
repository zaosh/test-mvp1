import { NextRequest, NextResponse } from 'next/server'
import { createReadStream, existsSync } from 'fs'
import { stat } from 'fs/promises'
import prisma from '@/lib/prisma'
import { requireRole, isNextResponse } from '@/lib/roles'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, ['ADMIN', 'QA', 'ENGINEER', 'MANAGER'])
  if (isNextResponse(auth)) return auth

  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: params.id },
      include: {
        testRun: {
          include: {
            testCase: { select: { visibility: true, ownerId: true } },
          },
        },
      },
    })

    if (!attachment) {
      return NextResponse.json({ error: 'File not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    // Visibility check via test run's test case
    if (attachment.testRun?.testCase) {
      const tc = attachment.testRun.testCase
      if (tc.visibility === 'RESTRICTED') {
        if (!['ADMIN', 'QA'].includes(auth.user.role) && tc.ownerId !== auth.user.id) {
          return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
        }
      }
    }

    // Verify file exists
    if (!existsSync(attachment.storagePath)) {
      return NextResponse.json({ error: 'File not found on disk', code: 'FILE_MISSING' }, { status: 404 })
    }

    const fileStat = await stat(attachment.storagePath)

    // Stream the file
    const stream = createReadStream(attachment.storagePath)
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk))
        stream.on('end', () => controller.close())
        stream.on('error', (err) => controller.error(err))
      },
    })

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': attachment.mimeType,
        'Content-Disposition': `attachment; filename="${attachment.originalName}"`,
        'Content-Length': fileStat.size.toString(),
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
