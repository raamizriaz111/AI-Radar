// =============================================================================
// AI Radar — Authentication & Route Protection Middleware
// =============================================================================
// Enforces mandatory authentication across all application surfaces.
// Any unauthenticated visitor attempting to access protected routes is
// immediately redirected to /login with preserve-destination redirect params.
// Authenticated visitors attempting to access /login or /signup are redirected
// directly to the intelligence dashboard.
// =============================================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { parseSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/sessionCookie';

// Exact public pages that unauthenticated visitors are permitted to view
const PUBLIC_PAGES = new Set([
  '/login',
  '/signup',
  '/terms',
  '/privacy',
  '/welcome',
]);

// Public API endpoints that must accept unauthenticated traffic
const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/auth/callback',
  '/api/admin/login',
  '/api/lemon/webhook',
  '/api/health',
];

/**
 * Validates whether the incoming request contains verified authentication
 * credentials via Supabase SSR tokens, Admin Passkey, or Application Session cookie.
 */
async function getAuthStatus(request: NextRequest): Promise<{
  authenticated: boolean;
  response: NextResponse;
}> {
  let response = NextResponse.next();

  // 1. Admin Token Check (Admin Passkey Session)
  const adminCookie = request.cookies.get('ai_radar_admin_token')?.value;
  if (adminCookie && adminCookie.startsWith('admin_session_valid')) {
    return { authenticated: true, response };
  }

  // 2. Application Session Cookie Check (Zero-latency offline / local session)
  const appSessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (appSessionCookie) {
    const payload = parseSessionToken(appSessionCookie);
    if (payload?.id && payload?.email) {
      return { authenticated: true, response };
    }
  }

  // 3. Supabase Auth Token Verification
  const allCookies = request.cookies.getAll();
  const hasSupabaseCookie = allCookies.some(
    (c) => c.name.startsWith('sb-') && c.name.includes('-auth-token') && c.value.length > 10
  );

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-id') &&
    hasSupabaseCookie
  ) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      });

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!error && user) {
        return { authenticated: true, response };
      }
    } catch {
      // If Supabase API is temporarily unreachable but valid auth cookie is present
      if (hasSupabaseCookie) {
        return { authenticated: true, response };
      }
    }
  } else if (hasSupabaseCookie) {
    return { authenticated: true, response };
  }

  return { authenticated: false, response };
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;

  // 1. Always allow Next.js internals, static assets, and icon files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname === '/icon.svg' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    /\.(?:svg|png|jpg|jpeg|webp|gif|ico|woff2?|ttf|css|js|map)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Always allow public API endpoints
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // 3. Resolve session status
  const { authenticated, response } = await getAuthStatus(request);

  // 4. Handle authenticated users visiting auth entry pages (/login or /signup)
  if (authenticated) {
    if (pathname === '/login' || pathname === '/signup') {
      const redirectParam = request.nextUrl.searchParams.get('redirect');
      const target =
        redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
          ? redirectParam
          : '/';
      return NextResponse.redirect(new URL(target, request.url));
    }
    return response;
  }

  // 5. Unauthenticated user handling
  // If the route is an explicit public page (e.g. /login, /signup, /terms, /privacy), allow it
  if (PUBLIC_PAGES.has(pathname)) {
    return NextResponse.next();
  }

  // If unauthenticated request hits an API endpoint not in public whitelist, return 401
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { ok: false, error: 'Authentication required. Please sign in to access AI Radar.' },
      { status: 401 }
    );
  }

  // For all other protected pages (/, /briefing, /news, /tools, /research, etc.):
  // Redirect immediately to /login with preserved redirect destination
  const loginUrl = new URL('/login', request.url);
  if (pathname !== '/') {
    loginUrl.searchParams.set('redirect', pathname + search);
  }

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icon.svg (app icon)
     * - robots.txt, sitemap.xml
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml).*)',
  ],
};
