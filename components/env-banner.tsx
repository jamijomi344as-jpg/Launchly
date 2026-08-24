"use client";

import { isSupabaseConfigured } from "@/lib/config";
import { Database } from "lucide-react";

export default function EnvBanner() {
  if (isSupabaseConfigured()) return null;
  return (
    <div
      role="status"
      className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs font-medium text-amber-700 dark:text-amber-300"
    >
      <span className="inline-flex items-center gap-2">
        <Database size={13} aria-hidden />
        Supabase ulanishi sozlanmagan — interfeys ishlaydi, lekin real ma’lumotlar
        ko‘rsatilmaydi. Batafsil: README &rarr; „Supabase sozlash“.
      </span>
    </div>
  );
}
