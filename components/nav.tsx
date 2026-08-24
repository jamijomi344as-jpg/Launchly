"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bookmark, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import ThemeToggle from "./theme-toggle";
import { cn, initials } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Bosh sahifa" },
  { href: "/projects", label: "Loyihalar" },
  { href: "/products", label: "Mahsulotlar" },
  { href: "/marketplace", label: "Buyurtma bozori" }
];

export interface NavUser {
  id: string;
  name: string | null;
  avatar: string | null;
  role: string | null;
}

export default function Nav({ user }: { user: NavUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/auth/logout", { method: "POST" });
    } finally {
      setLoggingOut(false);
      router.refresh();
      router.push("/");
    }
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <div className="container-site flex h-16 items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Launchly bosh sahifa">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-accent text-white">
            <span className="absolute h-2.5 w-2.5 rounded-full border-2 border-white/90" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400" />
          </span>
          <span className="text-xl font-extrabold tracking-tight">
            launchly<span className="text-accent">.</span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Asosiy menyu">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-semibold transition",
                isActive(l.href)
                  ? "bg-accent-soft text-accent"
                  : "text-muted hover:bg-surface-2 hover:text-ink"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          {user ? (
            <>
              <Link
                href="/saved"
                aria-label="Saqlangan loyihalar"
                title="Saqlangan loyihalar"
                className="hidden h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-ink sm:flex"
              >
                <Bookmark size={17} />
              </Link>
              <Link
                href="/dashboard"
                aria-label="Dashboard"
                title="Dashboard"
                className={cn(
                  "hidden h-9 items-center gap-2 rounded-xl px-2 text-sm font-semibold transition sm:flex",
                  isActive("/dashboard")
                    ? "bg-accent-soft text-accent"
                    : "text-muted hover:bg-surface-2 hover:text-ink"
                )}
              >
                <LayoutDashboard size={16} />
                <span className="hidden lg:inline">Dashboard</span>
              </Link>
              <Link
                href={`/u/${user.id}`}
                className="hidden items-center gap-2 rounded-xl border border-line bg-surface py-1 pl-1 pr-3 transition hover:bg-surface-2 sm:flex"
              >
                <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-accent-soft text-[10px] font-bold text-accent">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(user.name)
                  )}
                </span>
                <span className="max-w-[120px] truncate text-sm font-semibold">
                  {user.name || "Profil"}
                </span>
              </Link>
              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                aria-label="Chiqish"
                title="Chiqish"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-rose-500/10 hover:text-rose-500"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/auth/login" className="btn-ghost !py-2">
                Kirish
              </Link>
              <Link href="/auth/signup" className="btn-primary !py-2">
                Ro‘yxatdan o‘tish
              </Link>
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Menyuni yopish" : "Menyuni ochish"}
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-ink md:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-surface md:hidden">
          <nav className="container-site flex flex-col gap-1 py-3" aria-label="Mobil menyu">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-semibold",
                  isActive(l.href)
                    ? "bg-accent-soft text-accent"
                    : "text-muted hover:bg-surface-2 hover:text-ink"
                )}
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-ink"
                >
                  Dashboard
                </Link>
                <Link
                  href="/saved"
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-ink"
                >
                  Saqlangan loyihalar
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  disabled={loggingOut}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-rose-500 hover:bg-rose-500/10"
                >
                  Chiqish
                </button>
              </>
            ) : (
              <div className="flex gap-2 px-3 py-2">
                <Link href="/auth/login" className="btn-secondary flex-1">
                  Kirish
                </Link>
                <Link href="/auth/signup" className="btn-primary flex-1">
                  Ro‘yxatdan o‘tish
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
