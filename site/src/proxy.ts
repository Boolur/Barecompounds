import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

const STAFF_ROLES = new Set(["owner", "admin", "fulfillment", "read_only"]);

function redirectWithCookies(url: URL, source: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);
  source.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

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
          response = NextResponse.next({ request });
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
