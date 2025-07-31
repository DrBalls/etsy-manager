import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        // Allow access to auth routes
        if (req.nextUrl.pathname.startsWith('/auth')) {
          return true;
        }
        
        // Allow access to API routes
        if (req.nextUrl.pathname.startsWith('/api/auth')) {
          return true;
        }
        
        // Require authentication for all other routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - auth (auth pages)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api/auth|auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
};