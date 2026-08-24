"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Briefcase,
  CalendarClock,
  DollarSign,
  Loader2,
  Plus,
  Send
} from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";
import type { OpenOrder } from "@/lib/types";
import {
  cn,
  formatDate,
  formatBudget,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_STYLE,
  timeAgo
} from "@/lib/utils";
import Modal from "./modal";
import OrderForm from "./order-form";
import { EmptyState, ErrorState, SkeletonGrid } from "./ui";

export default function OrderExplorer() {
  const [orders, setOrders] = useState<OpenOrder[] | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<OpenOrder | null>(null);
  const [creating, setCreating] = useState(false);
  const [justCreated, setJustCreated] = useState(false);
  const [user, setUser] = useState<{ id: string; role: string | null; name: string | null; email: string | null } | null>(null);

  const load = useCallback(async () => {
    setError(false);
    setOrders(null);
    const supabase = getSupabase();
    if (!supabase) {
      setOrders([]);
      return;
    }
    const { data, error } = await supabase
      .from("open_orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setError(true);
      return;
    }
    setOrders(data ?? []);
  }, []);

  useEffect(() => {
    void load();
    (async () => {
      const supabase = getSupabase();
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, role")
        .eq("id", data.user.id)
        .maybeSingle();
      setUser({
        id: data.user.id,
        role: profile?.role ?? null,
        name: profile?.full_name ?? null,
        email: profile?.email ?? null
      });
    })();
  }, [load]);

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {};
    (orders ?? []).forEach((o) => {
      map[o.status] = (map[o.status] ?? 0) + 1;
    });
    return map;
  }, [orders]);

  async function submitProposal(order: OpenOrder, values: { price: string; duration: string; message: string }) {
    const supabase = getSupabase();
    if (!supabase || !user) return { error: "Kiritilmagan" };
    const { error } = await supabase.from("order_proposals").insert({
      order_id: order.id,
      developer_id: user.id,
      price: Number(values.price),
      duration: values.duration,
      message: values.message
    });
    if (error) return { error: error.message };
    setOrders((prev) =>
      (prev ?? []).map((o) =>
        o.id === order.id ? { ...o, proposals_count: o.proposals_count + 1 } : o
      )
    );
    return { error: null as string | null };
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" aria-label="Holatlar bo‘yicha statistika">
          {(["new", "proposals", "selected"] as const).map((s) => (
            <span key={s} className={cn("badge", ORDER_STATUS_STYLE[s])}>
              {ORDER_STATUS_LABEL[s]}: {statusCounts[s] ?? 0}
            </span>
          ))}
        </div>
        {user ? (
          <button type="button" onClick={() => setCreating(true)} className="btn-primary">
            <Plus size={15} /> Buyurtma berish
          </button>
        ) : (
          <div className="flex gap-2">
            <Link href="/auth/login" className="btn-secondary">
              Kirish
            </Link>
            <button type="button" onClick={() => setCreating(true)} className="btn-primary">
              <Plus size={15} /> Buyurtma berish (beznomsiz)
            </button>
          </div>
        )}
      </div>

      {justCreated && (
        <p className="mb-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          Buyurtmangiz joylandi. Endi dasturchilardan takliflar kelishini kuting.
        </p>
      )}

      {orders === null && !error && <SkeletonGrid count={3} />}
      {error && <ErrorState title="Buyurtmalarni yuklab bo‘lmadi" onRetry={() => void load()} />}
      {!error && orders && orders.length === 0 && (
        <EmptyState
          icon={<Briefcase size={22} />}
          title="Hali ochiq buyurtmalar yo‘q"
          text="Birinchi bo‘lib buyurtma bering — dasturchilar taklif yuboradi, siz eng yaxshisini tanlaysiz."
          action={
            <button type="button" onClick={() => setCreating(true)} className="btn-primary">
              <Plus size={15} /> Buyurtma berish
            </button>
          }
        />
      )}
      {!error && orders && orders.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {orders.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setSelected(o)}
              className="card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="line-clamp-1 text-base font-bold">{o.title}</h3>
                <span className={cn("badge shrink-0", ORDER_STATUS_STYLE[o.status])}>
                  {ORDER_STATUS_LABEL[o.status]}
                </span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-sm text-muted">{o.description}</p>
              {o.technologies.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.technologies.slice(0, 4).map((t) => (
                    <span key={t} className="chip">
                      {t}
                    </span>
                  ))}
                  {o.technologies.length > 4 && (
                    <span className="chip">+{o.technologies.length - 4}</span>
                  )}
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-muted">
                <span className="flex items-center gap-1.5">
                  <DollarSign size={13} /> {formatBudget(o.budget_min, o.budget_max)}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarClock size={13} /> {o.deadline ? formatDate(o.deadline) : "Muddat yo‘q"}
                </span>
                <span className="ml-auto">{timeAgo(o.created_at)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs font-bold">
                <span className="text-accent">{o.proposals_count} ta taklif</span>
                <span className="flex items-center gap-1 text-muted">
                  Batafsil <ArrowUpRight size={13} />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Order detail + proposal modal */}
      <Modal open={selected !== null} onClose={() => setSelected(null)} title={selected?.title ?? ""} wide>
        {selected && (
          <OrderDetail
            order={selected}
            user={user}
            onProposal={submitProposal}
            onCreated={() => setJustCreated(true)}
            onOpenCreate={() => {
              setSelected(null);
              setCreating(true);
            }}
          />
        )}
      </Modal>

      {/* Create order modal (guest or authenticated) */}
      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title={user ? "Yangi buyurtma" : "Buyurtma berish (beznomsiz)"}
        wide
      >
        <OrderForm
          profile={user ? { id: user.id, full_name: user.name, email: user.email } : null}
          onCreated={() => {
            setCreating(false);
            setJustCreated(true);
            setOrders(null);
            void load();
          }}
          onCancel={() => setCreating(false)}
        />
      </Modal>
    </div>
  );
}

function OrderDetail({
  order,
  user,
  onProposal,
  onCreated,
  onOpenCreate
}: {
  order: OpenOrder;
  user: { id: string; role: string | null; name: string | null; email: string | null } | null;
  onProposal: (
    order: OpenOrder,
    values: { price: string; duration: string; message: string }
  ) => Promise<{ error: string | null }>;
  onCreated: () => void;
  onOpenCreate: () => void;
}) {
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function send(ev: React.FormEvent) {
    ev.preventDefault();
    setFormError(null);
    if (Number(price) <= 0) {
      setFormError("Narx raqam bo‘lsin (0 dan katta).");
      return;
    }
    if (!duration.trim()) {
      setFormError("Muddatni kiriting (masalan: 2 hafta).");
      return;
    }
    if (message.trim().length < 10) {
      setFormError("Xabar kamida 10 ta belgidan iborat bo‘lsin.");
      return;
    }
    setSending(true);
    const { error } = await onProposal(order, { price, duration, message });
    setSending(false);
    if (error) {
      setFormError(error);
      return;
    }
    setSent(true);
    onCreated();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("badge", ORDER_STATUS_STYLE[order.status])}>
          {ORDER_STATUS_LABEL[order.status]}
        </span>
        <span className="chip">
          <DollarSign size={12} className="mr-1" />
          {formatBudget(order.budget_min, order.budget_max)}
        </span>
        <span className="chip">
          <CalendarClock size={12} className="mr-1" />
          {order.deadline ? formatDate(order.deadline) : "Muddat belgilanmagan"}
        </span>
      </div>

      <p className="whitespace-pre-wrap text-sm leading-relaxed">{order.description}</p>

      {order.technologies.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {order.technologies.map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-muted">
        {order.proposals_count} ta taklif yuborilgan · {timeAgo(order.created_at)}
      </p>

      <Link
        href={`/orders/${order.id}`}
        className="btn-secondary w-full"
      >
        Buyurtma sahifasida ochish — takliflar va chat
      </Link>

      <div className="border-t border-line pt-5">
        <h3 className="text-sm font-extrabold">Taklif yuborish</h3>
        {sent ? (
          <p className="mt-3 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            Taklifyingiz yuborildi! Buyurtmachi tanlagach, kontaktlar ochiladi.
          </p>
        ) : !user ? (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-muted">
              Taklif yuborish uchun developer roll bilan tizimga kiring.
            </p>
            <div className="flex gap-2">
              <Link href="/auth/login" className="btn-secondary flex-1">
                Kirish
              </Link>
              <Link href="/auth/signup" className="btn-primary flex-1">
                Ro‘yxatdan o‘tish
              </Link>
            </div>
          </div>
        ) : user.role !== "developer" ? (
          <div className="mt-3 space-y-1.5 rounded-xl bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-700 dark:text-amber-400">
            <p>Taklif yuborish faqat developer roll uchun ochiq.</p>
            <Link
              href={`/orders/${order.id}`}
              className="text-xs underline underline-offset-2 hover:opacity-80"
            >
              Buyurtmani shaxsiy sahifasida ochish — takliflarni ko‘rish va boshqarish
            </Link>
          </div>
        ) : (
          <form onSubmit={send} className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="op-price" className="label">
                  Narx ($)
                </label>
                <input
                  id="op-price"
                  className="input"
                  type="number"
                  min={1}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="500"
                />
              </div>
              <div>
                <label htmlFor="op-duration" className="label">
                  Muddat
                </label>
                <input
                  id="op-duration"
                  className="input"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="2 hafta"
                />
              </div>
            </div>
            <div>
              <label htmlFor="op-message" className="label">
                Xabar
              </label>
              <textarea
                id="op-message"
                className="input min-h-[90px] resize-y"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Loyihani qanday bajarishingizni qisqacha yozing…"
              />
            </div>
            {formError && <span role="alert" className="field-error !mt-0">{formError}</span>}
            <div className="flex justify-end gap-2">
              <button type="submit" disabled={sending} className="btn-primary">
                {sending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Taklifni yuborish
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
