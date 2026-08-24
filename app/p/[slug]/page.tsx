import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Eye, Star, Trophy, Users } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase-server";
import { siteUrl } from "@/lib/config";
import type { OwnerRef, Tag } from "@/lib/types";
import {
  cn,
  formatDate,
  formatCompact,
  initials,
  PROJECT_STATUS_LABEL,
  PROJECT_STATUS_STYLE,
  ROLE_LABEL,
  ROLE_STYLE
} from "@/lib/utils";
import { fetchSimilarProjects } from "@/lib/discover";
import ProjectActions from "@/components/project-actions";
import ProjectCard from "@/components/project-card";
import Comments from "@/components/comments";
import RateCard from "@/components/rate-card";
import { EmptyState } from "@/components/ui";

interface ProjectPageData {
  id: string;
  owner_id: string;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  category: string;
  status: string;
  images: string[];
  demo_url: string | null;
  repo_url: string | null;
  likes_count: number;
  views_count: number;
  try_clicks: number;
  created_at: string;
  updated_at: string;
  profiles: OwnerRef | null;
  project_tags?: Array<{ tags: Tag | null }> | null;
}

async function fetchProject(slug: string) {
  const supabase = createServerSupabase();
  if (!supabase) return null;
  let { data, error } = await supabase
    .from("projects")
    .select(
      "*, profiles(id, full_name, avatar_url, role), project_tags(tags(id, name, slug))"
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    // Tag migratsiyasi qo'llanmagan bo'lsa — embedsiz qayta urinish.
    ({ data, error } = await supabase
      .from("projects")
      .select("*, profiles(id, full_name, avatar_url, role)")
      .eq("slug", slug)
      .maybeSingle());
  }
  if (error || !data) return null;
  return data as ProjectPageData;
}

export async function generateMetadata({
  params
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const project = await fetchProject(params.slug);
  if (!project) {
    return { title: "Loyiha topilmadi" };
  }
  const { data: ratings } = await (async () => {
    const supabase = createServerSupabase();
    if (!supabase) return { data: null };
    return supabase
      .from("project_ratings")
      .select("idea_score, design_score, execution_score")
      .eq("project_id", project.id);
  })();

  const rows = ratings ?? [];
  const ratingAvg =
    rows.length > 0
      ? Math.round(
          (rows.reduce(
            (s, r) => s + (r.idea_score + r.design_score + r.execution_score) / 3,
            0
          ) /
            rows.length) *
            10
        ) / 10
      : null;

  return {
    title: project.title,
    description:
      project.short_description ||
      project.description.slice(0, 160) ||
      `${project.category} kategoriyasidagi loyiha`,
    openGraph: {
      title: `${project.title} — Launchly`,
      description: project.short_description || project.category,
      type: "website",
      images: project.images?.[0] ? [project.images[0]] : []
    },
    alternates: {
      canonical: `${siteUrl()}/p/${project.slug}`
    }
  };
}

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabase();
  const project = await fetchProject(params.slug);

  if (!project) {
    // Supabase configured but project missing → real 404 (SEO).
    if (supabase) {
      notFound();
    }
    return (
      <div className="container-site py-16">
        <EmptyState
          title="Supabase ulanishi sozlanmagan"
          text="Loyiha sahifalari real ma’lumotlarni Supabase‘dan o‘qiydi. .env.example bo‘yicha o‘zgarishlarni sozlang."
        />
      </div>
    );
  }

  // The project exists, so Supabase is configured; keep a non-null handle.
  const db = supabase!;

  // Record a real view event (fire-and-forget; triggers maintain views_count).
  void db
    .from("project_events")
    .insert({ project_id: project.id, event_type: "view" })
    .then(() => undefined);

  const [ratingsRes, commentsCountRes] = await Promise.all([
    db
      .from("project_ratings")
      .select("idea_score, design_score, execution_score")
      .eq("project_id", project.id),
    db
      .from("project_comments")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id)
      .is("parent_id", null)
  ]);

  const ratings = ratingsRes.data ?? [];
  const ratingAvg =
    ratings.length > 0
      ? Math.round(
          (ratings.reduce(
            (s, r) => s + (r.idea_score + r.design_score + r.execution_score) / 3,
            0
          ) /
            ratings.length) *
            10
        ) / 10
      : null;
  const commentCount = commentsCountRes.count ?? 0;
  const owner = project.profiles;
  const projectTags: Tag[] = (project.project_tags ?? [])
    .map((pt) => pt.tags)
    .filter((t): t is Tag => t != null);

  // Haftalik TOP-3 g'olibi va o'xshash loyihalar (migratsiya qo'llanmagan
  // bo'lsa xatolik o'rniga bo'sh natija).
  const [winnerRes, similar] = await Promise.all([
    db
      .from("weekly_winners")
      .select("id, rank")
      .eq("project_id", project.id)
      .order("rank", { ascending: true })
      .limit(1)
      .maybeSingle()
      .then((r) => r, () => null),
    fetchSimilarProjects(project.id, 3)
  ]);
  const isWeeklyWinner = !!winnerRes?.data;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: project.title,
    description: project.short_description || project.description,
    url: `${siteUrl()}/p/${project.slug}`,
    applicationCategory: project.category,
    operatingSystem: "Web",
    ...(ratingAvg != null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: ratingAvg,
            ratingCount: ratings.length
          }
        }
      : {}),
    ...(project.images?.[0] ? { image: project.images[0] } : {}),
    ...(owner ? { author: { "@type": "Person", name: owner.full_name } } : {})
  };

  return (
    <div className="container-site py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-accent"
      >
        <ArrowLeft size={15} /> Loyihalarga qaytish
      </Link>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1.5fr_.9fr]">
        <div>
          {/* Screenshots */}
          {project.images && project.images.length > 0 ? (
            <div className="space-y-3">
              {project.images.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt={`${project.title} — ekran rasm ${i + 1}`}
                  className={cn(
                    "w-full rounded-2xl border border-line object-cover",
                    i === 0 && "aspect-[16/9]"
                  )}
                />
              ))}
            </div>
          ) : (
            <div className="flex aspect-[16/9] items-center justify-center rounded-2xl border border-line bg-gradient-to-br from-accent-soft via-surface-2 to-surface">
              <span className="text-6xl font-black tracking-tight text-accent/40">
                {initials(project.title)}
              </span>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className={cn("badge", PROJECT_STATUS_STYLE[project.status as keyof typeof PROJECT_STATUS_STYLE])}>
              {PROJECT_STATUS_LABEL[project.status as keyof typeof PROJECT_STATUS_LABEL] ?? project.status}
            </span>
            <span className="badge bg-surface-2 text-muted">{project.category}</span>
            {projectTags.map((t) => (
              <Link
                key={t.id}
                href={`/tags/${t.slug}`}
                className="badge bg-accent-soft font-semibold text-accent transition hover:bg-accent hover:text-white"
                title={`${t.name} tagidagi loyihalar`}
              >
                {t.name}
              </Link>
            ))}
            {isWeeklyWinner && (
              <span className="badge gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400" title="Haftalik TOP-3 g'olibi">
                <Trophy size={12} /> Hafta g‘olibi
              </span>
            )}
            <span className="ml-auto text-xs text-muted">
              Joylangan: {formatDate(project.created_at)}
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            {project.title}
          </h1>
          {project.short_description && (
            <p className="mt-2 text-base text-muted">{project.short_description}</p>
          )}

          <div className="mt-5">
            <ProjectActions
              projectId={project.id}
              likesCount={project.likes_count}
              viewsCount={project.views_count}
              demoUrl={project.demo_url}
              repoUrl={project.repo_url}
            />
          </div>

          {project.description && (
            <section className="mt-8" aria-label="To‘liq tavsif">
              <h2 className="text-lg font-extrabold tracking-tight">Batafsil</h2>
              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-ink/90">
                {project.description}
              </p>
            </section>
          )}

          {similar.length > 0 && (
            <section className="mt-10" aria-label="O‘xshash loyihalar">
              <h2 className="text-lg font-extrabold tracking-tight">
                O‘xshash loyihalar
              </h2>
              <p className="mt-1 text-sm text-muted">
                Bir xil taglarga ega boshqa loyihalar
              </p>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {similar.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </section>
          )}

          <div className="mt-10 border-t border-line pt-8">
            <Comments projectId={project.id} />
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {owner && (
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-accent-soft text-sm font-black text-accent">
                  {owner.avatar_url ? (
                    <img src={owner.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(owner.full_name)
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold">
                    {owner.full_name || "Foydalanuvchi"}
                  </p>
                  <span className={cn("badge mt-1", ROLE_STYLE[owner.role])}>
                    {ROLE_LABEL[owner.role] ?? owner.role}
                  </span>
                </div>
              </div>
              <div className="my-4 grid grid-cols-3 divide-x divide-line border-y border-line py-3 text-center">
                <div>
                  <p className="flex items-center justify-center gap-1 text-sm font-extrabold">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    {ratingAvg != null ? ratingAvg.toFixed(1) : "—"}
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold text-muted">REYTING</p>
                </div>
                <div>
                  <p className="flex items-center justify-center gap-1 text-sm font-extrabold">
                    <Users size={12} className="text-muted" />
                    {formatCompact(commentCount)}
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold text-muted">FIKRLAR</p>
                </div>
                <div>
                  <p className="flex items-center justify-center gap-1 text-sm font-extrabold">
                    <Eye size={12} className="text-muted" />
                    {formatCompact(project.views_count)}
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold text-muted">KO‘RISH</p>
                </div>
              </div>
              <Link href={`/u/${owner.id}`} className="btn-secondary w-full">
                Profilni ko‘rish <ExternalLink size={13} />
              </Link>
            </div>
          )}
          <RateCard projectId={project.id} />
        </aside>
      </div>
    </div>
  );
}
