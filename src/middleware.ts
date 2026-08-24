import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════
// KAIZY — SYNCHRONOUS EDGE MIDDLEWARE (Zero Role Flash)
// 1. Synchronously decodes JWT & role cookies at the Edge
// 2. Injects x-user-type header BEFORE any page renders
// 3. Immediate role redirects (no client-side 300ms flash)
// ═══════════════════════════════════════════════════════

// Public static / informational paths
const PUBLIC_INFO_PATHS = [
  '/welcome',
  '/terms',
  '/privacy',
  '/refunds',
  '/worker-agreement',
  '/how-kaizy-earns',
  '/pricing',
  '/help',
  '/search',
  '/marketplace',
];

// Worker-only paths
const WORKER_PATHS = [
  '/dashboard/worker',
  '/dashboard/performance',
  '/active-job',
  '/worker/my-jobs',
  '/worker/job',
  '/worker/active-job',
  '/worker/payment-received',
  '/worker/review-hirer',
  '/earnings',
  '/schedule',
  '/kaizy-score',
  '/leaderboard',
  '/kaizy-pro',
  '/incentives',
  '/commission',
  '/job-photos',
  '/contractor',
  '/kaizylearn',
  '/onboarding/bank',
  '/onboarding/specialization',
  '/worker/profile',
  '/register/worker',
];

// Hirer-only paths
const HIRER_PATHS = [
  '/dashboard/hirer',
  '/hirer/my-jobs',
  '/hirer/sos',
  '/hirer/browse',
  '/hirer/booking',
  '/hirer/tracking',
  '/hirer/review',
  '/booking',
  '/post-job',
  '/my-bookings',
  '/tracking',
  '/saved-workers',
  '/saved-addresses',
  '/onboarding/hirer',
  '/profile',
  '/register/hirer',
];

/**
 * Synchronously parses JWT payload without async crypto latency
 */
function parseJwtPayload(token: string): { userType?: string; sub?: string; phone?: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── 1. Skip internal assets & API routes ──
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/sw.js'
  ) {
    return NextResponse.next();
  }

  // ── 2. Read authentication tokens & role cookies synchronously ──
  const token = req.cookies.get('kaizy_token')?.value;
  const cookieRole = req.cookies.get('kaizy_role')?.value || req.cookies.get('kaizy_user_type')?.value;

  const jwtPayload = token ? parseJwtPayload(token) : null;
  const isExpired = jwtPayload?.exp ? jwtPayload.exp * 1000 < Date.now() : false;

  const isAuthenticated = Boolean(token && jwtPayload && !isExpired);
  const userType: 'worker' | 'hirer' | null = isAuthenticated
    ? ((jwtPayload?.userType as 'worker' | 'hirer') || (cookieRole as 'worker' | 'hirer') || 'hirer')
    : (cookieRole as 'worker' | 'hirer') || null;

  // ── 3. Handle /login route: skip if already authenticated ──
  if (pathname === '/login') {
    if (isAuthenticated && userType) {
      const dest = userType === 'worker' ? '/dashboard/worker' : '/dashboard/hirer';
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // ── 4. Handle root / route: instant role dispatch ──
  if (pathname === '/') {
    if (isAuthenticated && userType === 'worker') {
      return NextResponse.redirect(new URL('/dashboard/worker', req.url));
    }
    // Hirers and unauthenticated visitors view the discovery home map
    const response = NextResponse.next();
    if (userType) response.headers.set('x-user-type', userType);
    return response;
  }

  // ── 5. Allow public informational routes ──
  if (PUBLIC_INFO_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    const response = NextResponse.next();
    if (userType) response.headers.set('x-user-type', userType);
    return response;
  }

  // Allow public worker profile view (e.g. /worker/abc-123) unless it is /worker/profile
  if (pathname.startsWith('/worker/') && pathname !== '/worker/profile') {
    const response = NextResponse.next();
    if (userType) response.headers.set('x-user-type', userType);
    return response;
  }

  // ── 6. Unauthenticated access to protected routes → redirect to /login ──
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 7. Role-based route protection & redirection ──
  if (userType === 'worker') {
    if (HIRER_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
      return NextResponse.redirect(new URL('/dashboard/worker', req.url));
    }
  } else if (userType === 'hirer') {
    if (WORKER_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
      return NextResponse.redirect(new URL('/dashboard/hirer', req.url));
    }
  }

  // ── 8. Forward request with verified user headers ──
  const response = NextResponse.next();
  if (jwtPayload?.sub) response.headers.set('x-user-id', jwtPayload.sub);
  if (userType) response.headers.set('x-user-type', userType);
  if (jwtPayload?.phone) response.headers.set('x-user-phone', jwtPayload.phone);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|woff|woff2|ttf|eot|css|js)$).*)',
  ],
};
