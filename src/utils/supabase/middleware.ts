import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
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

  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Skip auth checks for Next.js internals, static files, and api routes to prevent excessive network requests
  const isInternalOrAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico";

  if (isInternalOrAsset) {
    return supabaseResponse;
  }

  // Refresh session if it exists, or check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define route protections
  const isProtectedRoute =
    pathname === "/" ||
    pathname.startsWith("/leads") ||
    pathname.startsWith("/students") ||
    pathname.startsWith("/fees") ||
    pathname.startsWith("/attendance") ||
    pathname.startsWith("/reports");

  const isLoginRoute = pathname.startsWith("/login");

  if (isProtectedRoute && !user) {
    url.pathname = "/login";
    const redirectResponse = NextResponse.redirect(url);
    // Forward cookie headers to the redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        maxAge: cookie.maxAge,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        expires: cookie.expires,
        httpOnly: cookie.httpOnly,
      });
    });
    return redirectResponse;
  }

  if (isLoginRoute && user) {
    url.pathname = "/";
    const redirectResponse = NextResponse.redirect(url);
    // Forward cookie headers to the redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        maxAge: cookie.maxAge,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        expires: cookie.expires,
        httpOnly: cookie.httpOnly,
      });
    });
    return redirectResponse;
  }

  return supabaseResponse;
}
