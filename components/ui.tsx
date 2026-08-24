import Link from "next/link";
import { AlertTriangle, CloudOff, RefreshCw, SearchX } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/config";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  text,
  action,
  className
}: {
  icon?: React.ReactNode;
  title: string;
  text?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center",
        className
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
        {icon ?? <SearchX size={22} />}
      </span>
      <h3 className="text-base font-bold">{title}</h3>
      {text && <p className="max-w-md text-sm text-muted">{text}</p>}
      {action}
    </div>
  );
}

export function NotConfiguredState({ feature }: { feature: string }) {
  return (
    <EmptyState
      icon={<CloudOff size={22} />}
      title="Ma’lumotlar manbai ulanmagan"
      text={`${feature} uchun Supabase env o‘zgarishlari sozlanmagan. .env.example faylidagi qiymatlarni to‘ldiring va qayta ishga tushiring — keyin bu yerda real ma’lumotlar ko‘rinadi.`}
    />
  );
}

export function ErrorState({
  title = "Xatolik yuz berdi",
  text = "Ma’lumotlarni yuklab bo‘lmadi. Qaytadan urinib ko‘ring.",
  onRetry
}: {
  title?: string;
  text?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={<AlertTriangle size={22} className="text-rose-500" />}
      title={title}
      text={text}
      action={
        onRetry ? (
          <button type="button" onClick={onRetry} className="btn-secondary">
            <RefreshCw size={14} /> Qayta urinish
          </button>
        ) : undefined
      }
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[16/10] rounded-none" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-5 w-2/3" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-4/5" />
        <div className="flex items-center gap-2 pt-1">
          <div className="skeleton h-6 w-6 rounded-full" />
          <div className="skeleton h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SectionHeading({
  title,
  subtitle,
  action
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="card flex items-center gap-3 p-4">
      {icon && (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-xl font-extrabold leading-tight">{value}</p>
        <p className="truncate text-xs font-medium text-muted">{label}</p>
      </div>
    </div>
  );
}
