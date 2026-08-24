import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Circle,
  Eye,
  Heart,
  MessageCircle,
  MousePointerClick,
  Play,
  Star
} from "lucide-react";
import { createServerSupabase, getServerUser } from "@/lib/supabase-server";
import type { Order, OrderProposal, Profile, ProjectStatus } from "@/lib/types";
import {
  cn,
  formatBudget,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_STYLE,
  PROPOSAL_STATUS_LABEL,
  PROPOSAL_STATUS_STYLE,
  ROLE_LABEL,
  ROLE_STYLE,
  PROJECT_STATUS_LABEL,
  PROJECT_STATUS_STYLE
} from "@/lib/utils";
import ProfileForm from "@/components/profile-form";
import { EmptyState, StatCard } from "@/components/ui";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Loyihalar, buyurtmalar, statistika va profil — hammasi bitta oqimda.",
  robots: { index: false },
  openGraph: { title: "Dashboard", type: "website" }
};

export default async function DashboardPage() {
  const user = await getServerUser();

  if (!user) {
    return (
      <div className="container-site py-16">
        <EmptyState
          title="Dashboard uchun tizimga kiring"
          text="Shaxsiy statistika, loyihalar va buyurtmalar faqat kirgan foydalanuvchi uchun ko‘rsatiladi."
          action={
            <div className="flex gap-2">
              <Link href="/auth/login" className="btn-secondary">
                Kirish
              </Link>
              <Link href="/auth/signup" className="btn-primary">
                Ro‘yxatdan o‘tish
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const supabase = createServerSupabase();
  if (!supabase) {
    return (
      <div className="container-site py-16">
        <EmptyState
          title="Supabase ulanishi sozlanmagan"
          text="Dashboard real statistika Supabase'dan o‘qiladi. .env.example bo‘yicha o‘zgarishlarni sozlang."
        />
      </div>
    );
  }

  const [profileRes, projectsRes, ordersRes, proposalsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("projects")
      .select("id, title, slug, status, likes_count, views_count, try_clicks")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("*, order_proposals(id)")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("order_proposals")
      .select("*, orders(id, title, status)")
      .eq("developer_id", user.id)
      .order("created_at", { ascending: false })
  ]);

  const profile: Profile | null = (profileRes.data as Profile | null) ?? null;
  const projects = projectsRes.data ?? [];

  // Comment/rating aggregates are computed over the user's own projects only.
  const myIds = projects.map((p) => p.id as string);
  let ownComments = 0;
  let ownRatings: Array<{ idea_score: number; design_score: number; execution_score: number }> = [];
  if (myIds.length > 0) {
    const [cRes, rRes] = await Promise.all([
      supabase
        .from("project_comments")
        .select("id", { count: "exact", head: true })
        .in("project_id", myIds),
      supabase
        .from("project_ratings")
        .select("idea_score, design_score, execution_score")
        .in("project_id", myIds)
    ]);
    ownComments = cRes.count ?? 0;
    ownRatings = rRes.data ?? [];
  }

  const views = projects.reduce((s, p) => s + (p.views_count ?? 0), 0);
  const tryClicks = projects.reduce((s, p) => s + (p.try_clicks ?? 0), 0);
  const likes = projects.reduce((s, p) => s + (p.likes_count ?? 0), 0);
  const ratingAvg =
    ownRatings.length > 0
      ? Math.round(
          (ownRatings.reduce(
            (s, r) => s + (r.idea_score + r.design_score + r.execution_score) / 3,
            0
          ) /
            ownRatings.length) *
            10
        ) / 10
      : null;

  const myOrders = (ordersRes.data ?? []) as Array<Order & { order_proposals: Array<{ id: string }> }>;
  const myProposals = (proposalsRes.data ?? []) as Array<
    OrderProposal & { orders: { id: string; title: string; status: string } | null }
  >;

  const completeness = [
    { label: "To‘liq ism", done: Boolean(profile?.full_name?.trim()) },
    { label: "Bio", done: Boolean(profile?.bio?.trim()) },
    { label: "Avatar", done: Boolean(profile?.avatar_url) },
    { label: "Skills", done: (profile?.skills?.length ?? 0) > 0 },
    { label: "Kompaniya", done: Boolean(profile?.company_name?.trim()) },
    { label: "GitHub", done: Boolean(profile?.github_url) },
    { label: "Website", done: Boolean(profile?.website_url) }
  ];
  const completenessPct = Math.round(
    (completeness.filter((c) => c.done).length / completeness.length) * 100
  );

  return (
    <div className="container-site py-10">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {profile?.full_name ? `${profile.full_name.split(" ")[0]}, qaytdingiz!` : "Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Hammasi real Supabase ma’lumotlari — demo statistik yo‘q.
          </p>
        </div>
        {profile && (
          <span className={cn("badge", ROLE_STYLE[profile.role])}>
            {ROLE_LABEL[profile.role] ?? profile.role}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Ko‘rishlar" value={views} icon={<Eye size={18} />} />
        <StatCard label="Demo bosishlar" value={tryClicks} icon={<MousePointerClick size={18} />} />
        <StatCard label="Yoqtirishlar" value={likes} icon={<Heart size={18} />} />
        <StatCard label="Fikrlar" value={ownComments} icon={<MessageCircle size={18} />} />
        <StatCard
          label="O‘rtacha baho"
          value={ratingAvg != null ? ratingAvg.toFixed(1) : "0"}
          icon={<Star size={18} />}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_.9fr]">
        <div className="space-y-6">
          {/* My projects */}
          <section className="card p-5" aria-label="Mening loyihalarim">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold">Mening loyihalarim</h2>
              <Link href="/projects/new" className="link-muted flex items-center gap-1 text-xs font-bold">
                <Play size={12} /> Yangi loyiha
              </Link>
            </div>
            {projects.length === 0 ? (
              <p className="mt-4 rounded-xl bg-surface-2/60 px-4 py-6 text-center text-sm text-muted">
                Hali loyihangiz yo‘q. Birinchi loyihani joylab, statistika yig‘ila boshlasin.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {projects.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/p/${p.slug}`}
                        className="block truncate text-sm font-bold hover:text-accent"
                      >
                        {p.title}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-3 text-[11px] font-semibold text-muted">
                        <span className={cn("badge !text-[10px]", PROJECT_STATUS_STYLE[p.status as ProjectStatus])}>
                          {PROJECT_STATUS_LABEL[p.status as ProjectStatus] ?? p.status}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart size={10} /> {p.likes_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={10} /> {p.views_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointerClick size={10} /> {p.try_clicks}
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight size={15} className="shrink-0 text-muted" />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* My orders (as client) */}
          <section className="card p-5" aria-label="Mening buyurtmalarim">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold">Mening buyurtmalarim</h2>
              <Link href="/marketplace" className="link-muted flex items-center gap-1 text-xs font-bold">
                <Briefcase size={12} /> Bozorga o‘tish
              </Link>
            </div>
            {myOrders.length === 0 ? (
              <p className="mt-4 rounded-xl bg-surface-2/60 px-4 py-6 text-center text-sm text-muted">
                Hali buyurtmangiz yo‘q. Buyurtma berish bozordan amalga oshiriladi.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {myOrders.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/orders/${o.id}`}
                        className="block truncate text-sm font-bold hover:text-accent"
                      >
                        {o.title}
                      </Link>
                      <p className="mt-0.5 text-[11px] font-semibold text-muted">
                        {formatBudget(o.budget_min, o.budget_max)} · {o.order_proposals.length} taklif
                      </p>
                    </div>
                    <span className={cn("badge shrink-0", ORDER_STATUS_STYLE[o.status])}>
                      {ORDER_STATUS_LABEL[o.status]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* My proposals (as developer) */}
          <section className="card p-5" aria-label="Mening takliflarim">
            <h2 className="text-base font-extrabold">Mening takliflarim</h2>
            {myProposals.length === 0 ? (
              <p className="mt-4 rounded-xl bg-surface-2/60 px-4 py-6 text-center text-sm text-muted">
                Hali taklif yubormagansiz. Bozordagi buyurtmalarga taklif yuboring.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {myProposals.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      {p.orders ? (
                        <Link
                          href={`/orders/${p.orders.id}`}
                          className="block truncate text-sm font-bold hover:text-accent"
                        >
                          {p.orders.title}
                        </Link>
                      ) : (
                        <span className="text-sm font-bold">Buyurtma o‘chirilgan</span>
                      )}
                      <p className="mt-0.5 text-[11px] font-semibold text-muted">
                        ${p.price} · {p.duration}
                      </p>
                    </div>
                    <span className={cn("badge shrink-0", PROPOSAL_STATUS_STYLE[p.status])}>
                      {PROPOSAL_STATUS_LABEL[p.status]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          {/* Profile completeness */}
          <section className="card p-5" aria-label="Profil to‘liqligi">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold">Profil to‘liqligi</h2>
              <span className="text-sm font-extrabold text-accent">{completenessPct}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${completenessPct}%` }}
              />
            </div>
            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {completeness.map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-sm">
                  {c.done ? (
                    <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
                  ) : (
                    <Circle size={15} className="shrink-0 text-line" />
                  )}
                  <span className={c.done ? "text-ink" : "text-muted"}>{c.label}</span>
                </li>
              ))}
            </ul>
            <Link href={`/u/${user.id}`} className="btn-secondary mt-4 w-full">
              Publik profilni ko‘rish <ArrowUpRight size={13} />
            </Link>
          </section>

          {profile && <ProfileForm profile={profile} />}
        </div>
      </div>
    </div>
  );
}
