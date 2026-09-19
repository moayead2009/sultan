import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verify } from '@node-rs/argon2';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { createAuthSession, revokeAuthSession, sessionIsActive } from '@/lib/session';
import { safeAuthRedirect } from '@/lib/security-url';
import { env } from '@/lib/env';

export const authOptions: NextAuthOptions = {
  secret: env.AUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === 'production',
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 12
  },
  pages: {
    signIn: '/admin/login'
  },
  providers: [
    CredentialsProvider({
      name: 'Administrator',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, request) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? '';
        const ip =
          (request?.headers?.['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
          'unknown';
        const limit = checkRateLimit('login:' + ip, 10, 900);
        if (!limit.allowed || !email || password.length < 1) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user || user.status !== 'ACTIVE') return null;

        const valid = await verify(user.passwordHash, password);
        if (!valid) {
          logger.warn('auth.login_failed', { userId: user.id, ip });
          return null;
        }

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });
        await db.auditLog.create({
          data: {
            actorUserId: user.id,
            action: 'LOGIN',
            entityType: 'User',
            entityId: user.id
          }
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status
        };
      }
    })
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      return safeAuthRedirect(url, baseUrl);
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        const authSession = await createAuthSession(user.id);
        token.sessionId = authSession.id;
      }

      if (token.id && token.sessionId) {
        const current = await db.authSession.findUnique({
          where: { id: token.sessionId },
          include: {
            user: { select: { id: true, role: true, status: true } }
          }
        });
        if (!current || current.userId !== token.id || !sessionIsActive(current)) {
          token.status = 'DISABLED';
        } else {
          token.role = current.user.role;
          token.status = current.user.status;
        }
      } else if (token.id) {
        token.status = 'DISABLED';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.role = token.role ?? 'ADMIN';
        session.user.status = token.status ?? 'DISABLED';
        session.user.sessionId = token.sessionId;
      }
      return session;
    }
  },
  events: {
    async signOut(message) {
      const token = 'token' in message ? message.token : null;
      if (token?.sessionId) await revokeAuthSession(token.sessionId, token.id);
    }
  }
};
