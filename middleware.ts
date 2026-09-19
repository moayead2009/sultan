import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pieces = request.nextUrl.pathname.split('/').filter(Boolean);
  const locale =
    pieces[0] === 'en' || pieces[0] === 'ar'
      ? pieces[0]
      : pieces[0] === 'preview' && (pieces[1] === 'en' || pieces[1] === 'ar')
        ? pieces[1]
        : 'en';

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-route-locale', locale);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)']
};
