"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Clock,
  DollarSign,
  Loader2,
  Mail,
  Phone,
  Send,
  Star,
  X
} from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";
import type { ContactInfo, OrderProposal, Profile } from "@/lib/types";
import {
  cn,
  formatMoney,
  PROPOSAL_STATUS_LABEL,
  PROPOSAL_STATUS_STYLE,
  ROLE_LABEL
} from "@/lib/utils";

function ContactCard({ title, contact }: { title: string; contact: ContactInfo }) {
  const rows = [
    { icon: <Mail size={13} />, label: "Email", value: contact.email },
    { icon: <Phone size={13} />, label: "Telefon", value: contact.phone },
    { icon: <Send size={13} />, label: "Telegram", value: contact.telegram }
  ].filter((r) => r.value);
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
      <p className="text-[13px] font-extrabold text-emerald-700 dark:text-emerald-400">
        {title}
      </p>
      {contact.name && (
        <p className="mt-1 text-sm font-bold">{contact.name}</p>
      )}
      {rows.length > 0 ? (
        <ul className="mt-2 space-y-1.5 text-sm text-ink/90">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center gap-2">
              <span className="text-muted">{r.icon}</span>
              <span className="text-xs text-muted">{r.label}:</span>
              <span className="break-all font-semibold">{r.value}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-muted">Kontakt ma’lumotlari kiritilmagan.</p>
      )}
    </div>
  );
}

export default function OrderPanel({
  orderId,
  user,
  isClient,
  canChat,
  proposals,
  myProposalId,
  clientContact,
  ownContact,
  orderStatus,
  acceptedDeveloper
}: {
  orderId: string;
  user: { id: string; role: string };
  isClient: boolean;
  canChat: boolean;
  proposals: OrderProposal[];
  myProposalId: string | null;
  /** Shown to the accepted developer (retrieved via RPC on the server). */
  clientContact: ContactInfo | null;
  /** The client's own contact info (shown to the client). */
  ownContact: ContactInfo | null;
  orderStatus: string;
  acceptedDeveloper: Profile | null;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  async function acceptProposal(proposalId: string) {
    const supabase = getSupabase();
    if (!supabase) return;
    setBusyId(proposalId);
    setError(null);
    const { error } = await supabase.rpc("accept_proposal", { p_proposal: proposalId });
    setBusyId(null);
    if (error) {
      setError(error.message);
      return;
    }
    refresh();
  }

  async function rejectProposal(proposalId: string) {
    const supabase = getSupabase();
    if (!supabase) return;
    setBusyId(proposalId);
    setError(null);
    const { error } = await supabase.rpc("reject_proposal", { p_proposal: proposalId });
    setBusyId(null);
    if (error) {
      setError(error.message);
      return;
    }
    refresh();
  }

  async function setOrderStatus(status: "in_progress" | "completed") {
    const supabase = getSupabase();
    if (!supabase) return;
    setBusyId(`order-${status}`);
    setError(null);
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    setBusyId(null);
    if (error) {
      setError(error.message);
      return;
    }
    refresh();
  }

  async function submitProposal(ev: React.FormEvent) {
    ev.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    setError(null);
    if (Number(price) <= 0) {
      setError("Narx raqam bo‘lsin (0 dan katta).");
      return;
    }
    if (!duration.trim()) {
      setError("Muddatni kiriting (masalan: 2 hafta).");
      return;
    }
    if (message.trim().length < 10) {
      setError("Xabar kamida 10 ta belgidan iborat bo‘lsin.");
      return;
    }
    setSending(true);
    const { error: insErr } = await supabase.from("order_proposals").insert({
      order_id: orderId,
      developer_id: user.id,
      price: Number(price),
      duration: duration.trim(),
      message: message.trim()
    });
    setSending(false);
    if (insErr) {
      setError(insErr.code === "23505" ? "Siz allaqachon bu buyurtmaga taklif yuborgansiz." : insErr.message);
      return;
    }
    setPrice("");
    setDuration("");
    setMessage("");
    refresh();
  }

  if (isClient) {
    const canDecide = ["proposals", "selected"].includes(orderStatus);
    return (
      <div className="space-y-4">
        {error && (
          <p role="alert" className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}
        {proposals.length === 0 ? (
          <div className="rounded-xl bg-surface-2/60 px-4 py-8 text-center text-sm text-muted">
            Hali takliflar yo‘q. Dasturchilar taklif yuborishi bilan ular shu yerda
            ko‘rinadi — siz eng yaxshisini tanlaysiz.
          </div>
        ) : (
          <ul className="space-y-3">
            {proposals.map((p) => {
              const dev = p.profiles;
              const mine = p.status === "accepted";
              return (
                <li key={p.id} className={cn("card p-4", mine && "border-emerald-500/40")}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-accent-soft text-[10px] font-bold text-accent">
                      {dev?.avatar_url ? (
                        <img src={dev.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (dev?.full_name || "U").charAt(0).toUpperCase()
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">
                        {dev?.full_name || "Dasturchi"}
                      </p>
                      {dev && (
                        <p className="flex items-center gap-2 text-[11px] text-muted">
                          <span>{ROLE_LABEL[dev.role] ?? dev.role}</span>
                          <span className="flex items-center gap-0.5">
                            <Star size={10} className="fill-amber-400 text-amber-400" />
                            {Number(dev.rating_avg || 0).toFixed(1)}
                          </span>
                          <span>{dev.completed_orders} yakunlangan buyurtma</span>
                        </p>
                      )}
                    </div>
                    <span className={cn("badge ml-auto", PROPOSAL_STATUS_STYLE[p.status])}>
                      {PROPOSAL_STATUS_LABEL[p.status]}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink/90">{p.message}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-bold">
                    <span className="flex items-center gap-1 text-accent">
                      <DollarSign size={13} /> {formatMoney(p.price)}
                    </span>
                    <span className="flex items-center gap-1 text-muted">
                      <Clock size={13} /> {p.duration}
                    </span>
                    {canDecide && p.status === "pending" && (
                      <span className="ml-auto flex gap-2">
                        <button
                          type="button"
                          onClick={() => rejectProposal(p.id)}
                          disabled={busyId === p.id}
                          className="btn-secondary !px-3 !py-1.5 text-xs"
                        >
                          {busyId === p.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <X size={12} />
                          )}
                          Rad etish
                        </button>
                        <button
                          type="button"
                          onClick={() => acceptProposal(p.id)}
                          disabled={busyId === p.id}
                          className="btn-primary !px-3 !py-1.5 text-xs"
                        >
                          <Check size={12} /> Qabul qilish
                        </button>
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {orderStatus === "selected" && acceptedDeveloper && (
          <div className="space-y-3">
            <ContactCard
              title="Tanlangan dasturchi bilan aloqa"
              contact={{
                name: acceptedDeveloper.full_name,
                email: acceptedDeveloper.email,
                phone: acceptedDeveloper.phone,
                telegram: null
              }}
            />
            {ownContact && (
              <p className="text-xs text-muted">
                Sizning kontakt ma’lumotlaringiz dasturchiga ochildi — shu buyurtma
                bo‘yicha chat orqali ham yozishingiz mumkin.
              </p>
            )}
            <button
              type="button"
              onClick={() => setOrderStatus("in_progress")}
              disabled={busyId === "order-in_progress"}
              className="btn-primary"
            >
              {busyId === "order-in_progress" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Check size={15} />
              )}
              Ijroya boshlandi deb belgilash
            </button>
          </div>
        )}

        {orderStatus === "in_progress" && (
          <button
            type="button"
            onClick={() => setOrderStatus("completed")}
            disabled={busyId === "order-completed"}
            className="btn-primary"
          >
            {busyId === "order-completed" ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}
            Buyurtmani yakunlandi deb belgilash
          </button>
        )}

        {canChat && (
          <p className="text-xs text-muted">
            Tanlovdan keyingi muhokimalar uchun pastdagi chatni ishlating.
          </p>
        )}
      </div>
    );
  }

  // Developer (non-client) view
  if (myProposalId) {
    const mine = proposals.find((p) => p.id === myProposalId);
    return (
      <div className="space-y-4">
        {mine && (
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-extrabold">Sizning taklifyingiz</p>
              <span className={cn("badge", PROPOSAL_STATUS_STYLE[mine.status])}>
                {PROPOSAL_STATUS_LABEL[mine.status]}
              </span>
            </div>
            <p className="mt-2 text-sm text-ink/90">{mine.message}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs font-bold">
              <span className="flex items-center gap-1 text-accent">
                <DollarSign size={13} /> {formatMoney(mine.price)}
              </span>
              <span className="flex items-center gap-1 text-muted">
                <Clock size={13} /> {mine.duration}
              </span>
            </div>
          </div>
        )}
        {mine?.status === "accepted" && clientContact && (
          <ContactCard title="Buyurtmachi kontaktlari" contact={clientContact} />
        )}
        {mine?.status === "rejected" && (
          <p className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
            Afsuski, bu taklif tanlanmadi. Boshqa buyurtmalarga ham taklif
            yuborishingiz mumkin.
          </p>
        )}
        {mine?.status === "pending" && (
          <p className="rounded-xl bg-accent-soft/60 px-4 py-3 text-sm text-accent">
            Taklifyingiz kutilmoqda. Buyurtmachi tanlov qilsa, kontaktlar o‘zaro
            ochiladi.
          </p>
        )}
      </div>
    );
  }

  if (user.role !== "developer") {
    return (
      <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-700 dark:text-amber-400">
        Siz investor ro‘lisidasiz — taklif yuborish faqat developer roll uchun ochiq.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
      <form onSubmit={submitProposal} className="card space-y-3 p-4">
        <p className="text-sm font-extrabold">Bu buyurtmaga taklif yuborish</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="opd-price" className="label">
              Narx ($)
            </label>
            <input
              id="opd-price"
              className="input"
              type="number"
              min={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="500"
            />
          </div>
          <div>
            <label htmlFor="opd-duration" className="label">
              Muddat
            </label>
            <input
              id="opd-duration"
              className="input"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="2 hafta"
            />
          </div>
        </div>
        <div>
          <label htmlFor="opd-message" className="label">
            Xabar
          </label>
          <textarea
            id="opd-message"
            className="input min-h-[90px] resize-y"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Loyihani qanday bajarishingizni qisqacha yozing…"
          />
        </div>
        <div className="flex justify-end">
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
    </div>
  );
}
