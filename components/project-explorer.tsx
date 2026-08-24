"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";
import type { ProjectCardData } from "@/lib/types";
import { cn, withProjectMetrics } from "@/lib/utils";
import ProjectCard from "./project-card";
import { EmptyState, ErrorState, SkeletonGrid } from "./ui";

type SortKey = "new" | "likes" | "rating";

export default function ProjectExplorer() {
  const [projects, setProjects] = useState<ProjectCardData[] | null>(null);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<SortKey>("new");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setError(false);
    setProjects(null);
    const supabase = getSupabase();
    if (!supabase) {
      setProjects([]);
      return;
    }
    const { data, error } = await supabase
      .from("projects")
      .select(
        "*, profiles(id, full_name, avatar_url, role), project_comments(id), project_ratings(idea_score, design_score, execution_score)"
      )
      .order("created_at", { ascending: false });
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
    setProjects((data ?? []).map(withProjectMetrics));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const categories = useMemo(() => {
    if (!projects) return [];
    return Array.from(new Set(projects.map((p) => p.category))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [projects]);

  const filtered = useMemo(() => {
    if (!projects) return [];
    const q = search.trim().toLowerCase();
    let list = projects.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (status !== "all" && p.status !== status) return false;
      if (!q) return true;
      const ownerName = p.profiles?.full_name ?? "";
      return (
        p.title.toLowerCase().includes(q) ||
        p.short_description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        ownerName.toLowerCase().includes(q)
      );
    });
    list = [...list];
    if (sort === "likes") list.sort((a, b) => b.likes_count - a.likes_count);
    else if (sort === "rating")
      list.sort((a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0));
    return list;
  }, [projects, search, category, status, sort]);

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
              placeholder="Loyiha, tavsif yoki muallif bo‘yicha qidirish…"
              className="input !pl-10"
            />
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
              project={p}
              initialLiked={likedIds.has(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
