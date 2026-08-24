import Link from "next/link";
import { ArrowRight, Briefcase, Rocket, ShoppingBag, TrendingUp } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase-server";
import type { OpenOrder, Product, ProjectCardData } from "@/lib/types";
import {
  cn,
  formatBudget,
  initials,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_STYLE,
  withProjectMetrics
} from "@/lib/utils";
import ProjectCard from "@/components/project-card";
import { ErrorState, SectionHeading, SkeletonGrid } from "@/components/ui";

export default async function HomePage() {
  const supabase = createServerSupabase();
  const [projects, orders, products] = await Promise.all([
    supabase
      ? supabase
          .from("projects")
          .select(
            "*, profiles(id, full_name, avatar_url, role), project_comments(id), project_ratings(idea_score, design_score, execution_score)"
          )
          .order("created_at", { ascending: false })
          .limit(6)
      : Promise.resolve({ data: null, error: null }),
    supabase
      ? supabase
          .from("open_orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(3)
      : Promise.resolve({ data: null, error: null }),
    supabase
      ? supabase
          .from("products")
          .select("*, profiles(id, full_name, avatar_url, role)")
          .order("created_at", { ascending: false })
          .limit(4)
      : Promise.resolve({ data: null, error: null })
  ]);

  let likedIds = new Set<string>();
  if (supabase && projects.data) {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const { data: likes } = await supabase
        .from("project_likes")
        .select("project_id")
        .eq("user_id", data.user.id);
      likedIds = new Set((likes ?? []).map((l) => l.project_id));
    }
  }

  const projectCards: ProjectCardData[] = (projects.data ?? []).map(withProjectMetrics);
  const orderList: OpenOrder[] = (orders.data ?? []) as OpenOrder[];
  const productList: Product[] = (products.data ?? []) as Product[];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl"
        />
        <div className="container-site relative py-16 sm:py-24">
          <div className="max-w-2xl">
            <span className="badge bg-accent-soft text-accent">
              <TrendingUp size={12} /> O‘zbekiston startap ekologiyasi
            </span>
            <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
              G‘oyangizni mahsulotga,
              <br />
              mahsulotingizni <span className="text-accent">bozor</span>ga olib chiqing
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Loyihangizni taqdim eting, samimiy feedback oling, mahsulotingizni vitrinaga
              qo‘ying va buyurtma bozorida ish toping — hammasi bir platformada.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/projects/new" className="btn-primary !px-5 !py-3">
                <Rocket size={16} /> Loyihani joylash
              </Link>
              <Link href="/marketplace" className="btn-secondary !px-5 !py-3">
                Buyurtma bozori <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Recent projects */}
      <section className="container-site py-12">
        <SectionHeading
          title="Yangi loyihalar"
          subtitle="Platformadagi eng so‘nggi loyihalar — Supabase‘dan real vaqt rejimida"
          action={
            <Link href="/projects" className="link-muted flex items-center gap-1 font-bold">
              Barchasini ko‘rish <ArrowRight size={14} />
            </Link>
          }
        />
        {projects.error ? (
          <ErrorState
            title="Loyihalarni yuklab bo‘lmadi"
            text="Supabase’dan ma’lumot o‘qishda xatolik. Baza yaratilgandan so‘ng supabase/schema.sql fayli yuborilganiga ishonch hosil qiling."
          />
        ) : projects.data == null && supabase ? (
          <SkeletonGrid count={3} />
        ) : projectCards.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <Rocket size={22} />
            </span>
            <h3 className="text-base font-bold">Hali loyihalar yo‘q</h3>
            <p className="max-w-md text-sm text-muted">
              Supabase ulangan bo‘lsa va hali loyiha joylanmagan bo‘lsa, birinchi loyihani
              siz joylashingiz mumkin.
            </p>
            <Link href="/projects/new" className="btn-primary">
              <Rocket size={15} /> Birinchi loyihani joylash
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projectCards.map((p) => (
              <ProjectCard key={p.id} project={p} initialLiked={likedIds.has(p.id)} />
            ))}
          </div>
        )}
      </section>

      {/* Marketplace preview */}
      <section className="border-y border-line bg-surface">
        <div className="container-site py-12">
          <SectionHeading
            title="Ochiq buyurtmalar"
            subtitle="Bizneslar dasturchilardan kutayotgan ishlar — taklifingizni yuboring"
            action={
              <Link href="/marketplace" className="link-muted flex items-center gap-1 font-bold">
                <Briefcase size={14} /> Bozorni ochish
              </Link>
            }
          />
          {orderList.length === 0 ? (
            <div className="card px-6 py-10 text-center">
              <p className="text-sm text-muted">
                Hali ochiq buyurtmalar yo‘q — birinchi bo‘lib buyurtma bering.
              </p>
              <Link href="/marketplace" className="btn-primary mt-4">
                Buyurtma berish
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {orderList.map((o) => (
                <Link
                  key={o.id}
                  href="/marketplace"
                  className="card p-5 transition hover:-translate-y-0.5 hover:shadow-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-1 text-sm font-bold">{o.title}</h3>
                    <span className={cn("badge shrink-0", ORDER_STATUS_STYLE[o.status])}>
                      {ORDER_STATUS_LABEL[o.status]}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs text-muted">{o.description}</p>
                  <p className="mt-3 text-xs font-bold text-accent">
                    {formatBudget(o.budget_min, o.budget_max)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Products preview */}
      <section className="container-site py-12">
        <SectionHeading
          title="Mahsulot vitrinası"
          subtitle="Ishga tushirilgan mahsulotlar — bepul yoki pullik"
          action={
            <Link href="/products" className="link-muted flex items-center gap-1 font-bold">
              <ShoppingBag size={14} /> Vitrinani ochish
            </Link>
          }
        />
        {productList.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <ShoppingBag size={22} />
            </span>
            <h3 className="text-base font-bold">Hali mahsulotlar yo‘q</h3>
            <p className="max-w-md text-sm text-muted">
              Mahsulotingizni vitrinaga joylang — mualliflar real Supabase ma’lumotlari
              orqali ko‘rsatiladi.
            </p>
            <Link href="/products" className="btn-primary">
              Mahsulot joylash
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {productList.map((p) => (
              <Link
                key={p.id}
                href="/products"
                className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
                  {p.images && p.images.length > 0 ? (
                    <img
                      src={p.images[0]}
                      alt={p.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-soft via-surface-2 to-surface">
                      <span className="text-3xl font-black text-accent/50">
                        {initials(p.title)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="line-clamp-1 text-sm font-bold">{p.title}</h3>
                    <span className={cn("badge shrink-0", p.is_paid ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400")}>
                      {p.is_paid ? `${p.price ?? 0} ${p.currency}` : "Bepul"}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">
                    {p.description || "Tavsif kiritilmagan"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA band */}
      <section className="border-t border-line bg-surface">
        <div className="container-site flex flex-col items-center gap-4 py-14 text-center">
          <h2 className="max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">
            Dasturchi yoki startapchi ekaningizmi?
          </h2>
          <p className="max-w-md text-sm text-muted">
            Ro‘yxatdan o‘ting, loyihangizni ko‘rsating va investorlar hamda mijozlar bilan
            tanishing.
          </p>
          <div className="flex gap-3">
            <Link href="/auth/signup" className="btn-primary">
              Ro‘yxatdan o‘tish
            </Link>
            <Link href="/projects" className="btn-secondary">
              Loyihalarni ko‘rish
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
