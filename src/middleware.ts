import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Validar que las variables de entorno existan (acepta ambos nombres)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  
  const pathname = request.nextUrl.pathname;
  
  // Rutas que NO deben ser indexadas por buscadores
  const noIndexPaths = ['/app', '/workspace', '/calendario', '/perfil', '/login', '/registro', '/auth', '/dashboard'];
  const isNoIndexPath = noIndexPaths.some(path => pathname.startsWith(path));

  // Rutas públicas que no requieren autenticación
  const publicAuthPaths = ['/login', '/registro', '/auth/check-email', '/auth/confirm', '/auth/confirm-success', '/auth/confirm-error', '/auth/forgot-password', '/auth/reset-password'];
  const isPublicAuthPath = publicAuthPaths.some(path => pathname.startsWith(path));
  
  // La landing page (/) es pública
  const isLandingPage = pathname === '/';
  
  // Rutas protegidas que requieren autenticación (todo lo que está en /app, /workspace, /calendario, /perfil, /dashboard)
  const protectedPaths = ['/app', '/workspace', '/calendario', '/perfil', '/dashboard'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    // Permitir acceso a rutas públicas y landing
    if (isPublicAuthPath || isLandingPage) {
      return NextResponse.next();
    }
    // Redirigir a login si no está configurado
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: DO NOT REMOVE auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si el usuario está autenticado y visita la landing page o rutas de auth, redirigir a /app
  if (user && (isLandingPage || isPublicAuthPath)) {
    const url = request.nextUrl.clone();
    url.pathname = '/app';
    const redirectResponse = NextResponse.redirect(url);
    redirectResponse.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return redirectResponse;
  }

  // Si no hay usuario y está en una ruta protegida, redirigir a login
  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const redirectResponse = NextResponse.redirect(url);
    redirectResponse.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return redirectResponse;
  }

  // Añadir X-Robots-Tag para rutas que no deben indexarse
  if (isNoIndexPath) {
    supabaseResponse.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo/ (logo images)
     * - *.png, *.ico, *.svg (image files)
     * - api (API routes - they handle their own auth)
     */
    '/((?!_next/static|_next/image|favicon|logo|.*\\.png$|.*\\.ico$|.*\\.svg$|.*\\.webmanifest$|api).*)',
  ],
};
