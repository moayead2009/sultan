import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verify } from '@node-rs/argon2';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
      }
      if (token.id) {
        const current = await db.user.findUnique({
          where: { id: token.id },
          select: { role: true, status: true }
        });
        if (!current || current.status !== 'ACTIVE') {
          token.status = 'DISABLED';
        } else {
          token.role = current.role;
          token.status = current.status;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.role = token.role ?? 'ADMIN';
        session.user.status = token.status ?? 'DISABLED';
      }
      return session;
    }
  }
};
