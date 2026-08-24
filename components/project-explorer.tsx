"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";
import type { ProjectCardData, Tag } from "@/lib/types";
import { cn, withProjectMetrics } from "@/lib/utils";
import ProjectCard from "./project-card";
import { EmptyState, ErrorState, SkeletonGrid } from "./ui";

type SortKey = "new" | "likes" | "rating" | "hot";

const PROJECT_SELECT =
  "*, profiles(id, full_name, avatar_url, role), project_comments(id), project_ratings(idea_score, design_score, execution_score), project_tags(tags(id, name, slug))";

// 20260901 migratsiyasi hali qo'llanmagan bazada project_tags embed'i
// ishlamaydi — bu zaxira so'rov tagsiz ko'rsatadi.
const PROJECT_SELECT_FALLBACK =
  "*, profiles(id, full_name, avatar_url, role), project_comments(id), project_ratings(idea_score, design_score, execution_score)";

export default function ProjectExplorer() {
  const [projects, setProjects] = useState<ProjectCardData[] | null>(null);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<SortKey>("new");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeTagIds, setActiveTagIds] = useState<number[]>([]);
  const [winnerIds, setWinnerIds] = useState<Set<string>>(new Set());
  const [trendingIds, setTrendingIds] = useState<Set<string>>(new Set());
  // Server-side FTS natijalari (search_projects RPC); null → lokal filtr.
  const [rpcProjects, setRpcProjects] = useState<ProjectCardData[] | null>(null);
  const [rpcBusy, setRpcBusy] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    setProjects(null);
    const supabase = getSupabase();
    if (!supabase) {
      setProjects([]);
      return;
    }
    let { data, error } = await supabase
      .from("projects")
      .select(PROJECT_SELECT)
      .order("created_at", { ascending: false });
    if (error) {
      // Tag migratsiyasi qo'llanmagan bo'lishi mumkin — embedsiz qayta urinish.
      ({ data, error } = await supabase
        .from("projects")
        .select(PROJECT_SELECT_FALLBACK)
        .order("created_at", { ascending: false }));
    }
    if (error) {
      setError(true);
      return;
    }
    const { data: session } = await supabase.auth.getUser();
    if (session.user) {
      const { data: likes } = await supabase
        .from("project_likes")
        .select("project_id")
        .eq("user_id", session.user.id);
      setLikedIds(new Set((likes ?? []).map((l) => l.project_id)));
    }

    const rows = (data ?? []).map(withProjectMetrics);
    setProjects(rows);

    // Tag katalogi + haftalik g'oliblar + trend — migratsiya hali
    // qo'llanmagan bo'lsa xatoliklarni jimboyib o'tamiz.
    supabase
      .from("tags")
      .select("id, name, slug")
      .order("name")
      .then(({ data }) => {
        if (data) setTags(data as Tag[]);
      });
    supabase
      .from("weekly_winners")
      .select("project_id")
      .then(({ data }) => {
        if (data)
          setWinnerIds(
            new Set(data.map((w: { project_id: string }) => w.project_id))
          );
      });
    supabase
      .from("trending_projects")
      .select("project_id")
      .then(({ data }) => {
        if (data)
          setTrendingIds(
            new Set(data.map((t: { project_id: string }) => t.project_id))
          );
      });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Server-side full-text qidiruv (Postgres websearch_to_tsquery).
  const q = search.trim();
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || q.length < 2) {
      setRpcProjects(null);
      setRpcBusy(false);
      return;
    }
    setRpcBusy(true);
    const timer = setTimeout(async () => {
      const { data, error: rpcError } = await supabase
        .rpc("search_projects", { p_query: q, p_limit: 60 })
        .select(PROJECT_SELECT);
      // RPC mavjud bo'lmasa (migratsiya qo'llanmagan) → lokal ILIKE filtrga qaytamiz.
      setRpcProjects(rpcError || !data ? null : (data ?? []).map(withProjectMetrics));
      setRpcBusy(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  const categories = useMemo(() => {
    if (!projects) return [];
    return Array.from(new Set(projects.map((p) => p.category))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [projects]);

  const filtered = useMemo(() => {
    const base = rpcProjects ?? projects;
    if (!base) return [];
    const useRpc = rpcProjects !== null;
    const activeTags = new Set(activeTagIds);
    let list = base.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (status !== "all" && p.status !== status) return false;
      if (
        activeTags.size > 0 &&
        !p.tags?.some((t) => activeTags.has(t.id))
      )
        return false;
      if (!q || useRpc) return true;
      // Lokal zaxira filtri (RPC ishlamasa).
      const ownerName = p.profiles?.full_name ?? "";
      const tagText = (p.tags ?? []).map((t) => `${t.name} ${t.slug}`).join(" ");
      const haystack =
        `${p.title} ${p.short_description} ${p.description} ${p.category} ${tagText} ${ownerName}`.toLowerCase();
      return haystack.includes(q.toLowerCase());
    });
    list = [...list];
    if (sort === "likes") list.sort((a, b) => b.likes_count - a.likes_count);
    else if (sort === "rating")
      list.sort((a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0));
    else if (sort === "hot")
      list.sort(
        (a, b) =>
          Number(b.isTrending ?? false) - Number(a.isTrending ?? false) ||
          b.likes_count - a.likes_count
      );
    return list;
  }, [projects, rpcProjects, q, category, status, sort, activeTagIds]);

  function toggleTag(id: number) {
    setActiveTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  const decorated = (p: ProjectCardData) => ({
    ...p,
    isWinner: winnerIds.has(p.id) || undefined,
    isTrending: trendingIds.has(p.id) || undefined
  });

  return (
    <div>
      <div className="mb-5 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Loyihani qidirish</span>
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Loyiha, tag, kategoriya yoki muallif bo‘yicha qidirish…"
              className="input !pl-10"
            />
            {rpcBusy && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wide text-muted">
                FTS
              </span>
            )}
          </label>
          <div className="flex gap-3">
            <label className="sr-only" htmlFor="status-filter">
              Holat bo‘yicha filtr
            </label>
            <select
              id="status-filter"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input w-40"
            >
              <option value="all">Barcha holatlar</option>
              <option value="idea">G‘oya</option>
              <option value="mvp">MVP</option>
              <option value="in_progress">Jarayonda</option>
              <option value="launched">Ishga tushgan</option>
            </select>
            <label className="sr-only" htmlFor="sort-select">
              Saralash
            </label>
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="input w-40"
            >
              <option value="new">Eng yangi</option>
              <option value="likes">Eng ko‘p yoqtirilgan</option>
              <option value="rating">Eng yuqori reyting</option>
              <option value="hot">🔥 Trenddagiilar</option>
            </select>
          </div>
        </div>
        {categories.length > 0 && (
          <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Kategoriya filtri">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={cn(
                "chip shrink-0 transition hover:text-ink",
                category === "all" && "!bg-accent !text-white"
              )}
            >
              Barchasi
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "chip shrink-0 transition hover:text-ink",
                  category === c && "!bg-accent !text-white"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Tag filtri">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              Taglar:
            </span>
            {tags.map((t) => {
              const active = activeTagIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTag(t.id)}
                  aria-pressed={active}
                  title="Tag bo‘yicha filtrlash"
                  className={cn(
                    "chip transition hover:text-ink",
                    active && "!bg-accent !text-white"
                  )}
                >
                  {t.name}
                </button>
              );
            })}
            {activeTagIds.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTagIds([])}
                className="text-xs font-bold text-accent underline-offset-2 hover:underline"
              >
                Tozalash
              </button>
            )}
          </div>
        )}
      </div>

      {projects === null && !error && <SkeletonGrid count={6} />}
      {error && (
        <ErrorState
          title="Loyihalarni yuklab bo‘lmadi"
          onRetry={() => void load()}
        />
      )}
      {!error && projects && projects.length === 0 && (
        <EmptyState
          title="Hali loyihalar yo‘q"
          text="Loyihalar Supabase‘dan o‘qiladi. Birinchi loyihani joylab, shu bo‘limni jonlantiring."
          action={
            <Link href="/projects/new" className="btn-primary">
              <Plus size={15} /> Birinchi loyihani joylash
            </Link>
          }
        />
      )}
      {!error && projects && projects.length > 0 && filtered.length === 0 && (
        <EmptyState
          title="Hech narsa topilmadi"
          text="Qidiruv yoki filtr sozlamalarini o‘zgartirib ko‘ring."
        />
      )}
      {!error && projects && filtered.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={decorated(p)}
              initialLiked={likedIds.has(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
