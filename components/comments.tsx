"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";
import type { ProjectComment } from "@/lib/types";
import { cn, initials, timeAgo } from "@/lib/utils";

function CommentItem({
  comment,
  isOwn,
  onReply,
  onDelete,
  depth = 0
}: {
  comment: ProjectComment;
  isOwn: boolean;
  onReply?: (id: string) => void;
  onDelete?: (id: string) => void;
  depth?: number;
}) {
  const author = comment.profiles;
  return (
    <div className={cn(depth > 0 && "ml-9 border-l-2 border-line pl-4")}>
      <div className="flex gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2 text-[10px] font-bold text-muted">
          {author?.avatar_url ? (
            <img src={author.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            initials(author?.full_name)
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {author ? (
              <Link href={`/u/${author.id}`} className="text-[13px] font-bold hover:text-accent">
                {author.full_name || "Foydalanuvchi"}
              </Link>
            ) : (
              <span className="text-[13px] font-bold">Foydalanuvchi</span>
            )}
            <span className="text-[11px] text-muted">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink/90">
            {comment.text}
          </p>
          <div className="mt-1 flex items-center gap-3 text-xs font-semibold text-muted">
            {onReply && (
              <button type="button" onClick={() => onReply(comment.id)} className="transition hover:text-accent">
                Javob berish
              </button>
            )}
            {isOwn && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(comment.id)}
                aria-label="Fikrni o‘chirish"
                className="flex items-center gap-1 transition hover:text-rose-500"
              >
                <Trash2 size={12} /> O‘chirish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Comments({ projectId }: { projectId: string }) {
  const [comments, setComments] = useState<ProjectComment[] | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase
      .from("project_comments")
      .select("*, profiles(id, full_name, avatar_url)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });
    setComments(data ?? []);
  }, [projectId]);

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
      await load();
    })();
  }, [load]);

  // Realtime: new/deleted comments update the list without a refresh.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    const channel = supabase
      .channel(`comments-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "project_comments",
          filter: `project_id=eq.${projectId}`
        },
        () => void load()
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "project_comments",
          filter: `project_id=eq.${projectId}`
        },
        () => void load()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [projectId, load]);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const supabase = getSupabase();
    if (!supabase || !userId) return;
    const body = text.trim();
    if (body.length < 2) {
      setError("Fikr kamida 2 ta belgidan iborat bo‘lsin.");
      return;
    }
    setSending(true);
    setError(null);
    const { error: insErr } = await supabase.from("project_comments").insert({
      project_id: projectId,
      user_id: userId,
      parent_id: replyTo,
      text: body
    });
    setSending(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    setText("");
    setReplyTo(null);
    await load();
  }

  async function remove(id: string) {
    const supabase = getSupabase();
    if (!supabase || !userId) return;
    if (!window.confirm("Fikrni o‘chirmoqchimisiz?")) return;
    await supabase.from("project_comments").delete().eq("id", id).eq("user_id", userId);
    await load();
  }

  const topLevel = (comments ?? []).filter((c) => !c.parent_id);
  const repliesFor = (id: string) => (comments ?? []).filter((c) => c.parent_id === id);
  const replyTarget = replyTo ? comments?.find((c) => c.id === replyTo) : null;

  return (
    <section aria-label="Fikrlar">
      <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
        <MessageCircle size={18} className="text-accent" />
        Roast &amp; feedback
        <span className="text-sm font-bold text-muted">
          {comments == null ? "…" : `${comments.length}`}
        </span>
      </h2>

      <div className="mt-4 space-y-4">
        {userId ? (
          <form onSubmit={submit} className="card space-y-3 p-4">
            {replyTarget && (
              <div className="flex items-center justify-between rounded-lg bg-accent-soft/60 px-3 py-2 text-xs font-semibold text-accent">
                <span>
                  «{replyTarget.profiles?.full_name || "Foydalanuvchi"}» javobi
                </span>
                <button type="button" onClick={() => setReplyTo(null)} className="underline">
                  Bekor qilish
                </button>
              </div>
            )}
            <label htmlFor="comment-text" className="sr-only">
              Fikringiz
            </label>
            <textarea
              id="comment-text"
              className="input min-h-[80px] resize-y"
              placeholder="Loyiha haqida fikringizni yozing…"
              value={text}
              maxLength={2000}
              onChange={(e) => setText(e.target.value)}
            />
            {error && <span role="alert" className="field-error !mt-0">{error}</span>}
            <div className="flex justify-end">
              <button type="submit" disabled={sending} className="btn-primary !py-2">
                <Send size={14} /> {sending ? "Yuborilmoqda…" : "Yuborish"}
              </button>
            </div>
          </form>
        ) : (
          <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm text-muted">
              Fikr qoldirish va baho berish uchun tizimga kiring.
            </p>
            <div className="flex gap-2">
              <Link href="/auth/login" className="btn-secondary !py-2">
                Kirish
              </Link>
              <Link href="/auth/signup" className="btn-primary !py-2">
                Ro‘yxatdan o‘tish
              </Link>
            </div>
          </div>
        )}

        {comments == null ? (
          <div className="space-y-4">
            <div className="skeleton h-16 w-full" />
            <div className="skeleton h-24 w-full" />
          </div>
        ) : topLevel.length === 0 ? (
          <p className="rounded-xl bg-surface-2/60 px-4 py-6 text-center text-sm text-muted">
            Hali fikrlar yo‘q — birinchi bo‘lib fikr bildiring.
          </p>
        ) : (
          <div className="space-y-5">
            {topLevel.map((c) => (
              <div key={c.id} className="space-y-3">
                <CommentItem
                  comment={c}
                  isOwn={c.user_id === userId}
                  onReply={userId ? (id) => setReplyTo(id) : undefined}
                  onDelete={userId ? remove : undefined}
                />
                {repliesFor(c.id).map((r) => (
                  <CommentItem
                    key={r.id}
                    comment={r}
                    depth={1}
                    isOwn={r.user_id === userId}
                    onDelete={userId ? remove : undefined}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
