"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Lock, Mail } from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";
import { isSupabaseConfigured } from "@/lib/config";
import { EmptyState } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<false | "email" | "google">(false);

  if (!isSupabaseConfigured()) {
    return (
      <div className="container-site py-16">
        <EmptyState
          title="Kirish uchun avval Supabase ulanishini sozlang"
          text="NEXT_PUBLIC_SUPABASE_URL va NEXT_PUBLIC_SUPABASE_ANON_KEY o‘zgarishlarini .env.local fayliga yozing."
        />
      </div>
    );
  }

  async function withEmail(ev: React.FormEvent) {
    ev.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    setError(null);
    setBusy("email");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError(
        error.code === "invalid_credentials"
          ? "Email yoki parol noto‘g‘ri."
          : error.message
      );
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function withGoogle() {
    const supabase = getSupabase();
    if (!supabase) return;
    setError(null);
    setBusy("google");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
      }
    });
    setBusy(false);
    if (error) {
      setError(
        "Google OAuth sozlanmagan yoki yo‘q. Supabase → Authentication → Providers → Google ni yoqing va shu sayt URL'ini redirect ro‘yxatiga qo‘shing."
      );
    }
  }

  return (
    <div className="container-site flex justify-center py-14">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">Tizimga kirish</h1>
          <p className="mt-1 text-sm text-muted">
            Loyihalar, buyurtmalar va statistika — hammasi bir joyda.
          </p>
        </div>

        <form onSubmit={withEmail} className="card space-y-4 p-6" noValidate>
          <div>
            <label htmlFor="login-email" className="label">
              Email
            </label>
            <div className="relative">
              <Mail size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="login-email"
                className="input !pl-10"
                type="email"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="siz@email.uz"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="login-password" className="label">
              Parol
            </label>
            <div className="relative">
              <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="login-password"
                className="input !pl-10"
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy !== false} className="btn-primary w-full">
            {busy === "email" ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              "Kirish"
            )}
          </button>

          <div className="flex items-center gap-3 text-xs font-semibold text-muted">
            <span className="h-px flex-1 bg-line" />
            yoki
            <span className="h-px flex-1 bg-line" />
          </div>

          <button type="button" onClick={withGoogle} disabled={busy !== false} className="btn-secondary w-full">
            {busy === "google" ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <GoogleG size={15} />
            )}
            Google orqali davom etish
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          Hisobingiz yo‘qmi?{" "}
          <Link href="/auth/signup" className="font-bold text-accent hover:underline">
            Ro‘yxatdan o‘ting
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M21.35 11.1H12v3.2h5.35c-.5 2.5-2.62 3.9-5.35 3.9a5.9 5.9 0 1 1 0-11.8c1.5 0 2.87.55 3.92 1.45l2.38-2.38A9.3 9.3 0 0 0 12 2.7a9.3 9.3 0 1 0 0 18.6c5.35 0 8.85-3.77 8.85-9.1 0-.37-.03-.74-.1-1.1z"
      />
    </svg>
  );
}
