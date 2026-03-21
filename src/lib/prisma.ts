import { PrismaClient } from '@prisma/client'
import { registerMiddleware } from '../../prisma/middleware'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (!globalForPrisma.prisma) {
  registerMiddleware(prisma)
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export { prisma }
export default prisma
