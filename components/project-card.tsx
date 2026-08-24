"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bookmark, Eye, Heart, MessageCircle, Star } from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";
import type { ProjectCardData } from "@/lib/types";
import { cn, formatCompact, initials, PROJECT_STATUS_LABEL, PROJECT_STATUS_STYLE } from "@/lib/utils";

export default function ProjectCard({
  project,
  initialLiked = false
}: {
  project: ProjectCardData;
  initialLiked?: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const owner = project.profiles;
  // Server count already reflects `initialLiked`; apply the local toggle delta.
  const likeCount = Math.max(
    0,
    project.likes_count + (liked ? 1 : 0) - (initialLiked ? 1 : 0)
  );

  async function requireUser(): Promise<string | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/auth/login");
      return null;
    }
    return data.user.id;
  }

  async function toggleLike() {
    const uid = await requireUser();
    if (!uid) return;
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    try {
      const { data: existing } = await supabase
        .from("project_likes")
        .select("project_id")
        .eq("project_id", project.id)
        .eq("user_id", uid)
        .maybeSingle();
      if (existing) {
        await supabase.from("project_likes").delete().eq("project_id", project.id).eq("user_id", uid);
        setLiked(false);
      } else {
        await supabase.from("project_likes").insert({ project_id: project.id, user_id: uid });
        setLiked(true);
      }
    } finally {
      setBusy(false);
    }
  }

  async function toggleSave() {
    const uid = await requireUser();
    if (!uid) return;
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    try {
      const { data: existing } = await supabase
        .from("saved_projects")
        .select("project_id")
        .eq("project_id", project.id)
        .eq("user_id", uid)
        .maybeSingle();
      if (existing) {
        await supabase.from("saved_projects").delete().eq("project_id", project.id).eq("user_id", uid);
        setSaved(false);
      } else {
        await supabase.from("saved_projects").insert({ project_id: project.id, user_id: uid });
        setSaved(true);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="card group flex flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-card">
      <Link
        href={`/p/${project.slug}`}
        className="relative block aspect-[16/10] overflow-hidden bg-surface-2"
      >
        {project.images && project.images.length > 0 ? (
          <img
            src={project.images[0]}
            alt={project.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-soft via-surface-2 to-surface">
            <span className="text-4xl font-black tracking-tight text-accent/50">
              {initials(project.title)}
            </span>
          </div>
        )}
        <span className={cn("badge absolute left-3 top-3 backdrop-blur", PROJECT_STATUS_STYLE[project.status])}>
          {PROJECT_STATUS_LABEL[project.status]}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="truncate font-bold text-accent">{project.category}</span>
          <span className="flex shrink-0 items-center gap-1 font-semibold text-muted">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            {project.ratingAvg != null ? project.ratingAvg.toFixed(1) : "—"}
          </span>
        </div>
        <Link href={`/p/${project.slug}`} className="mt-1.5 block">
          <h3 className="line-clamp-1 text-base font-bold transition group-hover:text-accent">
            {project.title}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-muted">
          {project.short_description || "Tavsif kiritilmagan"}
        </p>

        {owner && (
          <Link
            href={`/u/${owner.id}`}
            className="mt-3 flex min-w-0 items-center gap-2"
            title={owner.full_name || "Foydalanuvchi"}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft text-[10px] font-bold text-accent">
              {owner.avatar_url ? (
                <img src={owner.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(owner.full_name)
              )}
            </span>
            <span className="truncate text-xs font-semibold text-muted transition hover:text-accent">
              {owner.full_name || "Foydalanuvchi"}
            </span>
          </Link>
        )}

        <div className="mt-auto flex items-center gap-4 border-t border-line pt-3 text-xs font-semibold text-muted">
          <button
            type="button"
            onClick={toggleLike}
            disabled={busy}
            aria-pressed={liked}
            aria-label={liked ? "Yoqtirishni bekor qilish" : "Yoqtirish"}
            className={cn(
              "flex items-center gap-1.5 transition hover:text-rose-500",
              liked && "text-rose-500"
            )}
          >
            <Heart size={14} className={cn(liked && "fill-rose-500")} />
            {formatCompact(likeCount)}
          </button>
          <span className="flex items-center gap-1.5" title="Fikrlar soni">
            <MessageCircle size={14} />
            {formatCompact(project.commentCount)}
          </span>
          <span className="flex items-center gap-1.5" title="Ko‘rishlar">
            <Eye size={14} />
            {formatCompact(project.views_count)}
          </span>
          <button
            type="button"
            onClick={toggleSave}
            disabled={busy}
            aria-pressed={saved}
            aria-label={saved ? "Saqlanganlardan olib tashlash" : "Saqlash"}
            title={saved ? "Saqlanganlardan olib tashlash" : "Saqlash"}
            className={cn(
              "ml-auto flex items-center gap-1.5 transition hover:text-accent",
              saved && "text-accent"
            )}
          >
            <Bookmark size={14} className={cn(saved && "fill-accent")} />
            {saved && "Saqlangan"}
          </button>
        </div>
      </div>
    </article>
  );
}
