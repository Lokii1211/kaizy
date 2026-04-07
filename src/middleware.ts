import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// ═══════════════════════════════════════════════════════
// KAIZY — EDGE MIDDLEWARE (runs before every route)
// 1. Protects private routes — redirects to /login
// 2. Role-based routing — ZERO flash bug
// 3. Runs at the edge — no Node.js APIs
// ═══════════════════════════════════════════════════════

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kaizy-default-secret-change-in-production-2026'
);

// Routes that don't need authentication
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/onboarding',
  '/welcome',
  '/terms',
  '/privacy',
  '/refunds',
  '/worker-agreement',
  '/how-kaizy-earns',
  '/api/',       // API routes handle their own auth
  '/_next/',     // Next.js internals
  '/favicon',
  '/kaizy-logo',
  '/manifest',
  '/sw.js',
];

// Worker-only routes
const WORKER_PATHS = [
  '/dashboard/worker',
  '/dashboard/performance',
  '/active-job',
  '/earnings',
  '/schedule',
  '/kaizy-score',
  '/leaderboard',
  '/kaizy-pro',
  '/incentives',
];

// Hirer-only routes
const HIRER_PATHS = [
  '/dashboard/hirer',
  '/booking',
  '/post-job',
  '/my-bookings',
  '/tracking',
  '/saved-workers',
  '/saved-addresses',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── 1. Skip public paths ──
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ── 2. Skip static files ──
  if (
    pathname.includes('.') || // files with extensions
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // ── 3. Get token from cookie ──
  const token = req.cookies.get('kaizy_token')?.value;

  if (!token) {
    // ── No token: redirect to login ──
    // But allow home page (/) for discovery
    if (pathname === '/') return NextResponse.next();

    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 4. Verify JWT ──
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userType = payload.userType as string;

    // ── 5. Role-based access control ──
    // Worker trying to access hirer-only paths
    if (userType === 'worker' && HIRER_PATHS.some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/dashboard/worker', req.url));
    }

    // Hirer trying to access worker-only paths
    if (userType === 'hirer' && WORKER_PATHS.some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/dashboard/hirer', req.url));
    }

    // ── 6. If logged-in user visits /login, send to dashboard ──
    if (pathname === '/login') {
      const dashboardUrl = userType === 'worker'
        ? '/dashboard/worker'
        : '/dashboard/hirer';
      return NextResponse.redirect(new URL(dashboardUrl, req.url));
    }

    // ── 7. Set user info in headers for server components ──
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.sub as string);
    response.headers.set('x-user-type', userType);
    response.headers.set('x-user-phone', (payload.phone as string) || '');
    return response;

  } catch {
    // ── Invalid/expired token → clear and redirect ──
    const loginUrl = new URL('/login', req.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('kaizy_token');
    response.cookies.delete('kaizy_user_type');
    return response;
  }
}

export const config = {
  matcher: [
    // Run on all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|woff|woff2|ttf|eot|css|js)$).*)',
  ],
};
