import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

// Paths that do not require authentication
const publicPaths = ['/login', '/api/auth/login'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Exclude static files, Next.js internal paths
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.match(/\.(png|jpg|jpeg|gif|svg)$/)
    ) {
        return NextResponse.next();
    }

    const isPublicPath = publicPaths.includes(pathname);

    // Get token from cookie
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    // Check if token exists and is valid
    let isTokenValid = false;
    if (token) {
        const payload = await verifyToken(token);
        if (payload) {
            isTokenValid = true;
        }
    }

    // Redirect to login if unauthenticated user tries to access a protected path
    if (!isPublicPath && !isTokenValid) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Redirect to dashboard if authenticated user tries to access login page
    if (pathname === '/login' && isTokenValid) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

// Config to specify which paths the middleware should apply to
export const config = {
    matcher: ['/((?!api/auth/login|_next/static|_next/image|favicon.ico).*)'],
};
