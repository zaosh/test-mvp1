import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import argon2 from 'argon2'
import prisma from '@/lib/prisma'
import { writeAuditLog } from '@/lib/audit'

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  })
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password)
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
    updateAge: 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const ipAddress = req?.headers?.['x-forwarded-for'] as string ?? 'unknown'

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          // Generic error — never reveal whether email exists
          return null
        }

        // Check account lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          return null
        }

        const isPasswordValid = await verifyPassword(user.passwordHash, credentials.password)

        if (!isPasswordValid) {
          const newFailedCount = user.failedLoginCount + 1
          const updateData: { failedLoginCount: number; lockedUntil?: Date } = {
            failedLoginCount: newFailedCount,
          }

          if (newFailedCount >= 5) {
            updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000)
            await writeAuditLog({
              action: 'ACCOUNT_LOCKED',
              entityType: 'User',
              entityId: user.id,
              userId: user.id,
              ipAddress,
            })
          }

          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          })

          await writeAuditLog({
            action: 'LOGIN_FAILED',
            entityType: 'User',
            entityId: user.id,
            userId: user.id,
            ipAddress,
          })

          return null
        }

        // Successful login — reset failed count
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginCount: 0,
            lockedUntil: null,
          },
        })

        await writeAuditLog({
          action: 'LOGIN',
          entityType: 'User',
          entityId: user.id,
          userId: user.id,
          ipAddress,
        })

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: false,
          sessionVersion: user.sessionVersion,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
        token.mustChangePassword = user.mustChangePassword
        token.sessionVersion = user.sessionVersion
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
        session.user.mustChangePassword = token.mustChangePassword as boolean
        session.user.sessionVersion = token.sessionVersion as number
      }

      // Verify sessionVersion against DB on every session access
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { sessionVersion: true },
        })
        if (!dbUser || dbUser.sessionVersion !== token.sessionVersion) {
          // Session invalidated — force re-login
          throw new Error('SESSION_REVOKED')
        }
      }

      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler }
export default handler
