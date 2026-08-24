"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Briefcase, Code2, Loader2, Mail, Lock, UserRound } from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";
import { isSupabaseConfigured } from "@/lib/config";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui";

type Role = "developer" | "investor";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("developer");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isSupabaseConfigured()) {
    return (
      <div className="container-site py-16">
        <EmptyState
          title="Ro‘yxatdan o‘tish uchun avval Supabase ulanishini sozlang"
          text="NEXT_PUBLIC_SUPABASE_URL va NEXT_PUBLIC_SUPABASE_ANON_KEY o‘zgarishlarini .env.local fayliga yozing."
        />
      </div>
    );
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setInfo(null);
    setError(null);
    if (fullName.trim().length < 2) {
      setError("Ismingizni kiriting.");
      return;
    }
    if (password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo‘lsin.");
      return;
    }
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim(), role },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
      }
    });
    setBusy(false);
    if (error) {
      setError(
        error.message === "User already registered"
          ? "Bu email allaqachon ro‘yxatdan o‘tgan. Kirish sahifasidan foydalaning."
          : error.message
      );
      return;
    }
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setInfo(
      "Ro‘yxatdan o‘tish muvaffaqiyatli! Emailingizdagi tasdiqlash havolasini oching — keyin tizimga kira olasiz."
    );
  }

  return (
    <div className="container-site flex justify-center py-14">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">Ro‘yxatdan o‘tish</h1>
          <p className="mt-1 text-sm text-muted">
            Bir daqiqada boshlang — loyihalar, bozor va statistika sizniki.
          </p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4 p-6" noValidate>
          <div>
            <span className="label">Siz qaysi roldasiz?</span>
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Rol tanlash">
              <button
                type="button"
                role="radio"
                aria-checked={role === "developer"}
                onClick={() => setRole("developer")}
                className={cn(
                  "rounded-xl border-2 p-3 text-left transition",
                  role === "developer"
                    ? "border-accent bg-accent-soft/50"
                    : "border-line hover:border-muted"
                )}
              >
                <Code2 size={18} className={role === "developer" ? "text-accent" : "text-muted"} />
                <p className="mt-1.5 text-sm font-bold">Dasturchi</p>
                <p className="text-xs text-muted">Loyiha joylash, buyurtmalarga taklif berish</p>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={role === "investor"}
                onClick={() => setRole("investor")}
                className={cn(
                  "rounded-xl border-2 p-3 text-left transition",
                  role === "investor"
                    ? "border-accent bg-accent-soft/50"
                    : "border-line hover:border-muted"
                )}
              >
                <Briefcase size={18} className={role === "investor" ? "text-accent" : "text-muted"} />
                <p className="mt-1.5 text-sm font-bold">Investor / Mijoz</p>
                <p className="text-xs text-muted">Buyurtma berish, loyihalarni kuzatish</p>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="signup-name" className="label">
              To‘liq ism
            </label>
            <div className="relative">
              <UserRound size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="signup-name"
                className="input !pl-10"
                value={fullName}
                autoComplete="name"
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ism Familiya"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="signup-email" className="label">
              Email
            </label>
            <div className="relative">
              <Mail size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="signup-email"
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
            <label htmlFor="signup-password" className="label">
              Parol
            </label>
            <div className="relative">
              <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="signup-password"
                className="input !pl-10"
                type="password"
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kamida 6 ta belgi"
                required
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {info}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? <Loader2 size={15} className="animate-spin" /> : "Hisob yaratish"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          Hisobingiz bormi?{" "}
          <Link href="/auth/login" className="font-bold text-accent hover:underline">
            Kiring
          </Link>
        </p>
      </div>
    </div>
  );
}
