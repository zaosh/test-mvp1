import prisma from '@/lib/prisma'
import { AuditAction } from '@prisma/client'

const SENSITIVE_FIELDS = ['passwordHash', 'token', 'secret', 'authorization', 'cookie']

function scrubSensitiveFields(data: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!data) return null
  const scrubbed = { ...data }
  for (const key of Object.keys(scrubbed)) {
    if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
      scrubbed[key] = '[REDACTED]'
    }
  }
  return scrubbed
}

interface AuditLogInput {
  action: AuditAction
  entityType: string
  entityId?: string
  userId?: string
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  ipAddress?: string
  userAgent?: string
}

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        userId: input.userId ?? null,
        before: scrubSensitiveFields(input.before as Record<string, unknown>) as object | undefined,
        after: scrubSensitiveFields(input.after as Record<string, unknown>) as object | undefined,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    })
  } catch {
    // Audit log failure must not crash the application
    // but we still want visibility in server logs
    if (process.env.NODE_ENV !== 'production') {
      console.error('Failed to write audit log')
    }
  }
}
