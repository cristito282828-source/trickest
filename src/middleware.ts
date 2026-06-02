import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

// ─── i18n Middleware ─────────────────────────────────────────────────────────────
const intlMiddleware = createMiddleware(routing);

// ─── Auth Middleware ─────────────────────────────────────────────────────────────
// Rutas protegidas que requieren autenticación
const protectedRoutes = ['/dashboard'];

// Rutas públicas (accesibles sin autenticación)
const publicRoutes = ['/', '/es', '/en', '/pt'];

export default async function middleware(request: any) {
  // ─── 1. Obtener pathname correctamente ────────────────────────────────────────
  const pathname = request.nextUrl?.pathname || '/';

  // ─── 2. Ejecutar middleware de i18n primero ────────────────────────────────
  const intlResponse = intlMiddleware(request);

  // Si la respuesta tiene una redirección (ej: redirección de idioma), retornarla
  if (intlResponse.status === 302 || intlResponse.status === 301) {
    return intlResponse;
  }

  // ─── 3. Verificar autenticación para rutas protegidas ────────────────────────
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isPublicRoute = publicRoutes.some((route) => pathname === route);

  // Solo verificar auth si es ruta protegida
  if (isProtectedRoute && !isPublicRoute) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Si no hay token, redirigir a home con mensaje en URL
    if (!token) {
      const url = new URL('/', request.url);
      url.searchParams.set('auth', 'required');
      return NextResponse.redirect(url);
    }
  }

  // ─── 4. Retornar respuesta del middleware i18n ─────────────────────────────────
  return intlResponse;
}

export const config = {
  // Match all pathnames except for
  // - API routes (/api/...)
  // - Static files (/_next/..., /images/..., etc.)
  // - Favicon and other root files
  matcher: [
    // Match all pathnames except those starting with:
    // - api (API routes)
    // - _next (Next.js internals)
    // - _vercel (Vercel internals)
    // - .*\\..* (files with extensions like favicon.ico)
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // Match root
    '/'
  ]
};
