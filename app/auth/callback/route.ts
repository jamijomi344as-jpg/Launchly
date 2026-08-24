import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next");
  const target =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/dashboard";

  if (code && isSupabaseConfigured()) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
            // In route handlers, setting on the cookie store updates the
            // response cookies.
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          }
        }
      }
    );
    // Exchanges the OAuth code for a session (and sets the auth cookies).
    await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.redirect(`${url.origin}${target}`);
  }

  // No code (e.g. direct visit) — go to login.
  return NextResponse.redirect(`${url.origin}/auth/login`);
}
