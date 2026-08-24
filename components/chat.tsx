"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";
import type { Message } from "@/lib/types";
import { cn, initials } from "@/lib/utils";
import { ErrorState } from "./ui";

export default function Chat({ orderId, userId }: { orderId: string; userId: string }) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, { name: string; avatar: string | null }>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  const resolveProfile = useCallback(async (uid: string, known?: Message["profiles"]) => {
    if (known) {
      setProfiles((p) => ({
        ...p,
        [uid]: { name: known.full_name, avatar: known.avatar_url }
      }));
      return;
    }
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", uid)
      .maybeSingle();
    if (data) {
      setProfiles((p) => ({ ...p, [uid]: { name: data.full_name, avatar: data.avatar_url } }));
    }
  }, []);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data, error } = await supabase
      .from("messages")
      .select("*, profiles(id, full_name, avatar_url)")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });
    if (error) {
      setLoadError(true);
      return;
    }
    setMessages(data ?? []);
    for (const m of data ?? []) {
      void resolveProfile(m.sender_id, m.profiles ?? undefined);
    }
  }, [orderId, resolveProfile]);

  useEffect(() => {
    setMessages(null);
    setLoadError(false);
    void load();
  }, [load]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    const channel = supabase
      .channel(`chat-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `order_id=eq.${orderId}`
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) =>
            prev && !prev.some((x) => x.id === m.id) ? [...prev, m] : prev
          );
          void resolveProfile(m.sender_id);
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [orderId, resolveProfile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages]);

  async function send(ev: React.FormEvent) {
    ev.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    const body = text.trim();
    if (body.length < 1) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      order_id: orderId,
      sender_id: userId,
      receiver_id: null,
      text: body
    });
    setSending(false);
    if (error) return;
    setText("");
    // Local optimistic append is handled by the realtime subscription,
    // but ensure the message appears even if the event is missed.
    await load();
  }

  if (loadError) {
    return <ErrorState title="Chat yuklanmadi" onRetry={() => void load()} />;
  }

  return (
    <div className="card flex h-[26rem] flex-col">
      <div className="border-b border-line px-4 py-3 text-sm font-extrabold">
        Buyurtma bo‘yicha suhbat
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {messages === null ? (
          <div className="space-y-3">
            <div className="skeleton h-10 w-2/3" />
            <div className="skeleton ml-auto h-10 w-1/2" />
          </div>
        ) : messages.length === 0 ? (
          <p className="pt-10 text-center text-sm text-muted">
            Xabarlar hali yo‘q — suhbatni boshlang.
          </p>
        ) : (
          messages.map((m) => {
            const own = m.sender_id === userId;
            const p = profiles[m.sender_id];
            return (
              <div key={m.id} className={cn("flex", own ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    own
                      ? "rounded-br-md bg-accent text-white"
                      : "rounded-bl-md bg-surface-2"
                  )}
                >
                  {!own && (
                    <p className="mb-0.5 flex items-center gap-1.5 text-[11px] font-bold opacity-70">
                      <span className="flex h-4 w-4 items-center justify-center overflow-hidden rounded-full bg-accent-soft text-[7px] font-bold text-accent">
                        {p?.avatar ? (
                          <img src={p.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          initials(p?.name)
                        )}
                      </span>
                      {p?.name || "Foydalanuvchi"}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <p className={cn("mt-1 text-right text-[10px] opacity-60")}>
                    {new Date(m.created_at).toLocaleTimeString("uz-UZ", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
        <label htmlFor="chat-input" className="sr-only">
          Xabar matni
        </label>
        <input
          id="chat-input"
          className="input flex-1"
          placeholder="Xabar yozing…"
          value={text}
          maxLength={4000}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" disabled={sending || text.trim().length === 0} aria-label="Yuborish" className="btn-primary !px-3.5">
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
