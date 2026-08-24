"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/** Dark/light toggle. Initial theme is applied by an inline script in the
 * root layout to avoid a flash of the wrong theme. */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("launchly-theme", next ? "dark" : "light");
    } catch {
      // storage unavailable — ignore
    }
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Yorug‘ rejimga o‘tish" : "Tungi rejimga o‘tish"}
      title={dark ? "Yorug‘ rejim" : "Tungi rejim"}
      className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
    >
      {mounted && dark ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  );
}
