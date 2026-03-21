import { Prisma } from '@prisma/client'

const SOFT_DELETE_MODELS = ['TestCase', 'TestRun', 'Issue', 'Component']

export function registerMiddleware(prisma: {
  $use: (middleware: Prisma.Middleware) => void
}) {
  // Immutability enforcement
  prisma.$use(async (params, next) => {
    if (params.model === 'Archive') {
      if (
        params.action === 'update' ||
        params.action === 'updateMany' ||
        params.action === 'delete' ||
        params.action === 'deleteMany'
      ) {
        throw new Error('Archives are immutable and cannot be modified')
      }
    }

    if (params.model === 'AuditLog') {
      if (
        params.action === 'update' ||
        params.action === 'updateMany' ||
        params.action === 'delete' ||
        params.action === 'deleteMany'
      ) {
        throw new Error('Audit logs are immutable and cannot be modified')
      }
    }

    return next(params)
  })

  // Soft delete: convert delete to update with deletedAt
  prisma.$use(async (params, next) => {
    if (params.model && SOFT_DELETE_MODELS.includes(params.model)) {
      if (params.action === 'delete') {
        params.action = 'update'
        params.args.data = { deletedAt: new Date() }
        return next(params)
      }
      if (params.action === 'deleteMany') {
        params.action = 'updateMany'
        if (params.args.data) {
          params.args.data.deletedAt = new Date()
        } else {
          params.args.data = { deletedAt: new Date() }
        }
        return next(params)
      }
    }
    return next(params)
  })

  // Soft delete: auto-filter deleted records from queries
  prisma.$use(async (params, next) => {
    if (params.model && SOFT_DELETE_MODELS.includes(params.model)) {
      if (params.action === 'findMany' || params.action === 'findFirst') {
        if (!params.args) params.args = {}
        if (!params.args.where) params.args.where = {}
        if (params.args.where.deletedAt === undefined) {
          params.args.where.deletedAt = null
        }
      }
      if (params.action === 'count') {
        if (!params.args) params.args = {}
        if (!params.args.where) params.args.where = {}
        if (params.args.where.deletedAt === undefined) {
          params.args.where.deletedAt = null
        }
      }
    }
    return next(params)
  })
}
