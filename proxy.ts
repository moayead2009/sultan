import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { isLocale } from '@/lib/i18n';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!pathname.startsWith('/admin') && !pathname.startsWith('/preview')) {
    try {
      const rule = await db.redirect.findUnique({ where: { fromPath: pathname } });
      if (rule?.enabled && rule.toPath !== pathname) {
        return NextResponse.redirect(new URL(rule.toPath, request.url), rule.permanent ? 308 : 307);
      }
    } catch {
      // Database-backed redirects should not take the site down before initial migration.
    }
  }

  const pieces = pathname.split('/').filter(Boolean);
  const locale =
    pieces[0] && isLocale(pieces[0])
      ? pieces[0]
      : pieces[0] === 'preview' && pieces[1] && isLocale(pieces[1])
        ? pieces[1]
        : 'en';

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-route-locale', locale);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)']
};
