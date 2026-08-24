"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, ExternalLink, Eye, Heart, Loader2, Play } from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";
import { cn, formatCompact } from "@/lib/utils";

export default function ProjectActions({
  projectId,
  likesCount,
  viewsCount,
  demoUrl,
  repoUrl
}: {
  projectId: string;
  likesCount: number;
  viewsCount: number;
  demoUrl: string | null;
  repoUrl: string | null;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [baseLiked, setBaseLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = getSupabase();
      if (!supabase) {
        setChecking(false);
        return;
      }
      const { data } = await supabase.auth.getUser();
      if (!data.user || !active) return;
      const [likes, savedRows] = await Promise.all([
        supabase.from("project_likes").select("project_id").eq("project_id", projectId).eq("user_id", data.user.id).maybeSingle(),
        supabase.from("saved_projects").select("project_id").eq("project_id", projectId).eq("user_id", data.user.id).maybeSingle()
      ]);
      if (!active) return;
      setLiked(Boolean(likes.data));
      setBaseLiked(Boolean(likes.data));
      setSaved(Boolean(savedRows.data));
      setChecking(false);
    })();
    return () => {
      active = false;
    };
  }, [projectId]);

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
      if (liked) {
        await supabase.from("project_likes").delete().eq("project_id", projectId).eq("user_id", uid);
        setLiked(false);
      } else {
        await supabase.from("project_likes").insert({ project_id: projectId, user_id: uid });
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
      if (saved) {
        await supabase.from("saved_projects").delete().eq("project_id", projectId).eq("user_id", uid);
        setSaved(false);
      } else {
        await supabase.from("saved_projects").insert({ project_id: projectId, user_id: uid });
        setSaved(true);
      }
    } finally {
      setBusy(false);
    }
  }

  async function openDemo(url: string) {
    const supabase = getSupabase();
    if (supabase) {
      supabase.from("project_events").insert({ project_id: projectId, event_type: "try_click" });
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={toggleLike} disabled={busy || checking} aria-pressed={liked} className={cn("btn-secondary", liked && "border-rose-500/40 text-rose-500")}>
        <Heart size={15} className={cn(liked && "fill-rose-500 text-rose-500")} />
        {checking ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          formatCompact(likesCount + (liked ? 1 : 0) - (baseLiked ? 1 : 0))
        )}
      </button>
      <button type="button" onClick={toggleSave} disabled={busy || checking} aria-pressed={saved} className={cn("btn-secondary", saved && "border-accent/40 text-accent")}>
        <Bookmark size={15} className={cn(saved && "fill-accent text-accent")} />
        {saved ? "Saqlangan" : "Saqlash"}
      </button>
      {demoUrl && (
        <a
          href={demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => openDemo(demoUrl)}
          className="btn-primary"
        >
          <Play size={15} /> Sinab ko‘rish
          <ExternalLink size={13} className="opacity-70" />
        </a>
      )}
      {repoUrl && (
        <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
          GitHub <ExternalLink size={13} className="opacity-70" />
        </a>
      )}
      <span className="flex items-center gap-1.5 text-xs font-semibold text-muted">
        <Eye size={13} /> {formatCompact(viewsCount)} ko‘rish
      </span>
    </div>
  );
}
