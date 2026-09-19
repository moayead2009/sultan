import type { DefaultSession } from 'next-auth';
import type { Role, UserStatus } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      status: UserStatus;
      sessionId?: string;
    } & DefaultSession['user'];
  }

  interface User {
    role: Role;
    status: UserStatus;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: Role;
    status?: UserStatus;
    sessionId?: string;
  }
}
