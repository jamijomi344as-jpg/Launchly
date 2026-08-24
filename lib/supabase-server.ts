import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./config";

/**
 * Server (RSC) Supabase client backed by the request cookies.
 * Returns `null` when Supabase is not configured.
 */
export function createServerSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore when the
            // response is not a redirect.
          }
        }
      }
    }
  );
}

/** Current signed-in user, or `null` (not configured / not signed in). */
export async function getServerUser(): Promise<User | null> {
  const supabase = createServerSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}
