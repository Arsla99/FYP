import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin-only routes
    if (pathname.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/sos', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        // Public routes that don't require auth
        const publicPaths = ['/auth', '/blogs', '/support', '/privacy-policy', '/api'];
        const isPublic = publicPaths.some(p => req.nextUrl.pathname.startsWith(p));
        if (isPublic) return true;

        // Static assets
        if (req.nextUrl.pathname.startsWith('/_next') || req.nextUrl.pathname.startsWith('/favicon')) {
          return true;
        }

        return !!token;
      },
    },
    pages: {
      signIn: '/auth',
    },
  }
);

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
};
