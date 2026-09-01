import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

const STAFF_ROLES = new Set(["owner", "admin", "fulfillment", "read_only"]);

function contentSecurityPolicy(nonce: string) {
  const developmentScripts =
    process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'";
  const developmentConnections =
    process.env.NODE_ENV === "production"
      ? ""
      : " http://127.0.0.1:* ws://127.0.0.1:* http://localhost:* ws://localhost:*";
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${developmentScripts}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self' data:",
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io${developmentConnections}`,
    "worker-src 'self' blob:",
    "upgrade-insecure-requests",
  ].join("; ");
}

function redirectWithCookies(url: URL, source: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);
  const csp = source.headers.get("Content-Security-Policy");
  if (csp) redirectResponse.headers.set("Content-Security-Policy", csp);
  source.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}

export async function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const nextResponse = () => {
    const result = NextResponse.next({
      request: { headers: requestHeaders },
    });
    result.headers.set("Content-Security-Policy", csp);
    return result;
  };
  let response = nextResponse();

  if (!isSupabaseConfigured()) {
    return response;
  }

  const supabase = createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = nextResponse();
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname, search } = request.nextUrl;
  const accountSubroute = pathname.startsWith("/account/");
  const adminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  if (!user && (accountSubroute || adminRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/account";
    url.search = "";
    url.searchParams.set("reason", "auth");
    url.searchParams.set("next", `${pathname}${search}`);
    return redirectWithCookies(url, response);
  }

  if (user && (adminRoute || accountSubroute)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role,account_status")
      .eq("id", user.id)
      .single();

    if (adminRoute && (!profile || profile.account_status !== "active" || !STAFF_ROLES.has(profile.role))) {
      const url = request.nextUrl.clone();
      url.pathname = "/account";
      url.search = "";
      url.searchParams.set("reason", "forbidden");
      return redirectWithCookies(url, response);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
