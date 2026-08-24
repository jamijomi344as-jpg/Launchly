"use client";

import { useCallback, useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";
import type { ProjectCardData } from "@/lib/types";
import { withProjectMetrics } from "@/lib/utils";
import ProjectCard from "./project-card";
import { EmptyState, ErrorState, SkeletonGrid } from "./ui";

export default function SavedList() {
  const [projects, setProjects] = useState<ProjectCardData[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    setProjects(null);
    const supabase = getSupabase();
    if (!supabase) {
      setProjects([]);
      return;
    }
    const { data: session } = await supabase.auth.getUser();
    if (!session.user) {
      setProjects([]);
      return;
    }
    const { data, error } = await supabase
      .from("saved_projects")
      .select(
        "project:projects(*, profiles(id, full_name, avatar_url, role), project_comments(id), project_ratings(idea_score, design_score, execution_score))"
      )
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    if (error) {
      setError(true);
      return;
    }
    type SavedRow = { project: Parameters<typeof withProjectMetrics>[0] };
    const rows = ((data ?? []) as unknown as SavedRow[]).map((row) =>
      withProjectMetrics(row.project)
    );
    setProjects(rows);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function unsave(projectId: string) {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data: session } = await supabase.auth.getUser();
    if (!session.user) return;
    await supabase
      .from("saved_projects")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", session.user.id);
    setProjects((prev) => (prev ?? []).filter((p) => p.id !== projectId));
  }

  return (
    <div>
      {projects === null && !error && <SkeletonGrid count={3} />}
      {error && <ErrorState title="Saqlangan loyihalar yuklanmadi" onRetry={() => void load()} />}
      {!error && projects && projects.length === 0 && (
        <EmptyState
          icon={<Bookmark size={22} />}
          title="Hali saqlangan loyihalar yo‘q"
          text="Yoqimli loyihalarni bookmark belgisi bilan saqlang — ular shu yerda to‘planadi."
        />
      )}
      {!error && projects && projects.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div key={p.id} className="relative">
              <ProjectCard project={p} initialLiked={false} />
              <button
                type="button"
                onClick={() => unsave(p.id)}
                className="btn-ghost absolute right-3 top-3 !rounded-full !bg-surface !px-2.5 !py-1.5 text-xs shadow"
                title="Saqlanganlar ro‘yxatidan olib tashlash"
              >
                Olib tashlash
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
