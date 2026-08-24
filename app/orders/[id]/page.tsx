import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarClock, DollarSign } from "lucide-react";
import { createServerSupabase, getServerUser } from "@/lib/supabase-server";
import type { ContactInfo, OrderProposal, OrderStatus, Profile } from "@/lib/types";
import {
  cn,
  formatDate,
  formatBudget,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_STYLE
} from "@/lib/utils";
import OrderPanel from "@/components/order-panel";
import Chat from "@/components/chat";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = {
  title: "Buyurtma",
  robots: { index: false }
};

interface SafeOrder {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  status: OrderStatus;
  created_at: string;
}

export default async function OrderPage({ params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) {
    // Guests work on the public marketplace listing instead.
    redirect("/marketplace");
  }

  const supabase = createServerSupabase();
  if (!supabase) {
    return (
      <div className="container-site py-16">
        <EmptyState title="Supabase ulanishi sozlanmagan" text="Buyurtma sahifalari Supabase'dan ishlaydi." />
      </div>
    );
  }

  // 1) The client can read the full order (RLS); everyone else falls back to
  //    the public-safe `open_orders` view (no contact columns).
  const { data: fullOrder } = await supabase
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  const isClient = Boolean(fullOrder);
  let order: SafeOrder | null = null;
  let ownContact: ContactInfo | null = null;
  let clientContact: ContactInfo | null = null;

  if (fullOrder) {
    order = fullOrder as SafeOrder;
    if (fullOrder.client_id === null) {
      ownContact = {
        name: fullOrder.guest_name,
        email: fullOrder.guest_email,
        phone: fullOrder.contact_phone,
        telegram: fullOrder.contact_telegram
      };
    } else {
      const { data: clientProfile } = await supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", fullOrder.client_id)
        .maybeSingle();
      ownContact = {
        name: clientProfile?.full_name ?? null,
        email: clientProfile?.email ?? null,
        phone: clientProfile?.phone ?? null,
        telegram: fullOrder.contact_telegram
      };
    }
  } else {
    const { data: publicOrder } = await supabase
      .from("open_orders")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();
    if (!publicOrder) notFound();
    order = publicOrder as SafeOrder;
  }

  // Proposals: RLS returns only what the caller may see
  // (own proposals, or all of them if the caller is the client).
  const { data: proposalsRaw } = await supabase
    .from("order_proposals")
    .select("*, profiles(*)")
    .eq("order_id", order!.id)
    .order("created_at", { ascending: true });
  const proposals: OrderProposal[] = (proposalsRaw ?? []) as OrderProposal[];

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const myRole = (myProfile?.role as string | undefined) ?? "investor";

  const myProposalId = !isClient
    ? (proposals.find((p) => p.developer_id === user.id)?.id ?? null)
    : null;

  // Accepted developer gets the client's contact via a restricted RPC.
  if (!isClient && myProposalId) {
    const mine = proposals.find((p) => p.id === myProposalId);
    if (mine?.status === "accepted") {
      const { data } = await supabase.rpc("get_order_contact", { p_order: order!.id });
      clientContact = (data as ContactInfo | null) ?? null;
    }
  }

  const acceptedProposal = proposals.find((p) => p.status === "accepted");
  const acceptedDeveloper: Profile | null = acceptedProposal?.profiles ?? null;
  const canChat = isClient || Boolean(myProposalId);

  return (
    <div className="container-site py-8">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-accent"
      >
        <ArrowLeft size={15} /> Buyurtma bozoriga qaytish
      </Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {order!.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-muted">
            <span className="flex items-center gap-1.5">
              <DollarSign size={13} />
              {formatBudget(order!.budget_min, order!.budget_max)}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarClock size={13} />
              {order!.deadline ? formatDate(order!.deadline) : "Muddat belgilanmagan"}
            </span>
          </div>
        </div>
        <span className={cn("badge", ORDER_STATUS_STYLE[order!.status])}>
          {ORDER_STATUS_LABEL[order!.status]}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_.9fr]">
        <div className="space-y-6">
          <section className="card p-5" aria-label="Buyurtma tavsifi">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-muted">
              Tavsif
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
              {order!.description}
            </p>
            {order!.technologies.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {order!.technologies.map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section aria-label="Takliflar">
            <h2 className="mb-3 text-lg font-extrabold tracking-tight">
              {isClient ? "Takliflar" : "Sizning qatnashishingiz"}
            </h2>
            <OrderPanel
              orderId={order!.id}
              user={{ id: user.id, role: myRole }}
              isClient={isClient}
              canChat={canChat}
              proposals={proposals}
              myProposalId={myProposalId}
              clientContact={clientContact}
              ownContact={ownContact}
              orderStatus={order!.status}
              acceptedDeveloper={acceptedDeveloper}
            />
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {canChat ? (
            <Chat orderId={order!.id} userId={user.id} />
          ) : (
            <div className="card px-5 py-8 text-center text-sm text-muted">
              Chat faqat buyurtma ishtirokchilari uchun ochiq: buyurtmachi yoki taklif
              yuborgan dasturchi.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
