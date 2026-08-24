import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase-server";
import { fetchProjectsByIds } from "@/lib/discover";
import type { ProjectCardData, WeeklyWinner } from "@/lib/types";
import { cn, formatCompact, formatDate, initials } from "@/lib/utils";
import { EmptyState, NotConfiguredState } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/config";

export const metadata: Metadata = {
  title: "Hafta g'oliblari arxivi",
  description:
    "Har haftaning eng yuqori reytingli TOP-3 loyihalari — Launchly reyting algoritmi bo'yicha.",
  openGraph: { title: "Hafta g'oliblari arxivi", type: "website" }
};

const MEDALS = ["🥇", "🥈", "🥉"];

function weekLabel(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${formatDate(weekStart)} — ${formatDate(end.toISOString())}`;
}

export default async function ArchivePage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="container-site py-10">
        <NotConfiguredState feature="G'oliblar arxivi" />
      </div>
    );
  }

  const supabase = createServerSupabase();
  const { data: winners, error } = await supabase
    ?.from("weekly_winners")
    .select("id, week_start, project_id, rank, score, created_at")
    .order("week_start", { ascending: false })
    .order("rank", { ascending: true }) ?? { data: null, error: null };

  // Migratsiya hali qo'llanmagan bo'lsa — bo'sh holat ko'rsatamiz.
  if (error || !winners || winners.length === 0) {
    return (
      <div className="container-site py-10">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Hafta g‘oliblari arxivi
        </h1>
        <p className="mt-1 text-sm text-muted">
          Har hafta yakunida reyting bo‘yicha TOP-3 loyihalar shu yerda
          saqlanadi.
        </p>
        <div className="mt-8">
          <EmptyState
            icon={<Trophy size={22} />}
            title="Hali g'oliblar qayd etilmagan"
            text="Birinchi hafta yakunlanishi bilan (dushanba, 00:05) avtomatik cron TOP-3 loyihalarni shu arxivga yozadi. snapshot_weekly_winners() funksiyasini qo'lda ham chaqirish mumkin."
          />
        </div>
      </div>
    );
  }

  const rows = winners as WeeklyWinner[];
  const byWeek = new Map<string, WeeklyWinner[]>();
  for (const w of rows) {
    const list = byWeek.get(w.week_start) ?? [];
    list.push(w);
    byWeek.set(w.week_start, list);
  }

  const projectIds = Array.from(new Set(rows.map((w) => w.project_id)));
  const projects = await fetchProjectsByIds(projectIds);
  const projectMap = new Map<string, ProjectCardData>(
    projects.map((p) => [p.id, p])
  );

  return (
    <div className="container-site py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Hafta g‘oliblari arxivi
        </h1>
        <p className="mt-1 text-sm text-muted">
          Har haftaning eng yuqori reytingli TOP-3 loyihalari — ballar likes,
          reyting va fikrlar soniga vaqt bo‘yicha pasayuvchi formulaga asoslanadi.
        </p>
      </div>

      <div className="space-y-10">
        {Array.from(byWeek.entries()).map(([week, list]) => (
          <section key={week} aria-label={`${weekLabel(week)} haftasi g'oliblari`}>
            <div className="mb-4 flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" />
              <h2 className="text-base font-extrabold tracking-tight">
                {weekLabel(week)}
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {list
                .sort((a, b) => a.rank - b.rank)
                .map((w) => {
                  const p = projectMap.get(w.project_id);
                  return (
                    <Link
                      key={w.id}
                      href={p ? `/p/${p.slug}` : "/projects"}
                      className="card group flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-card"
                    >
                      <span className="text-2xl" aria-hidden>
                        {MEDALS[w.rank - 1] ?? "🏆"}
                      </span>
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent-soft text-sm font-black text-accent">
                        {p?.images?.[0] ? (
                          <img
                            src={p.images[0]}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          initials(p?.title ?? "?")
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold transition group-hover:text-accent">
                          {p?.title ?? "Loyiha"}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {p ? p.category : ""}
                        </p>
                        <p className="mt-0.5 text-[11px] font-semibold text-muted">
                          ❤️ {formatCompact(p?.likes_count ?? 0)} · ball{" "}
                          {Number(w.score).toFixed(2)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
