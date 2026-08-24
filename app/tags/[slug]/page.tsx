import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Tag as TagIcon } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase-server";
import { siteUrl } from "@/lib/config";
import {
  fetchProjectsByTagId,
  fetchTagBySlug,
  fetchTagCounts,
  fetchTrendingProjectIds,
  fetchWinnerProjectIds
} from "@/lib/discover";
import ProjectCard from "@/components/project-card";
import { EmptyState, NotConfiguredState } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/config";
import { cn } from "@/lib/utils";

interface TagPageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params
}: TagPageProps): Promise<Metadata> {
  const tag = await fetchTagBySlug(params.slug);
  if (!tag) {
    return { title: "Tag topilmadi" };
  }
  const title = `${tag.name} loyihalari — Launchly`;
  const description = `Launchly'dagi ${tag.name} yo'nalishidagi eng yaxshi loyihalar: AI vositalari, startaplar va MVP'larni ko'ring, yoqtiring va feedback bering.`;
  return {
    title,
    description,
    keywords: [tag.name, `${tag.name} loyihalar`, `${tag.name} vositalari`, "startap", "Launchly"],
    openGraph: {
      title,
      description,
      type: "website"
    },
    alternates: {
      canonical: `${siteUrl()}/tags/${tag.slug}`
    }
  };
}

export default async function TagPage({ params }: TagPageProps) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="container-site py-10">
        <NotConfiguredState feature="Tag katalogi" />
      </div>
    );
  }

  const supabase = createServerSupabase();
  const tag = await fetchTagBySlug(params.slug);

  if (!tag) {
    if (supabase) notFound();
    return (
      <div className="container-site py-10">
        <NotConfiguredState feature="Tag katalogi" />
      </div>
    );
  }

  const [projects, winnerIds, trendingIds, popularTags] = await Promise.all([
    fetchProjectsByTagId(tag.id),
    fetchWinnerProjectIds(),
    fetchTrendingProjectIds(),
    fetchTagCounts(12)
  ]);

  return (
    <div className="container-site py-10">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-accent"
      >
        <ArrowLeft size={15} /> Barcha loyihalar
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <TagIcon size={16} />
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {tag.name}
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-muted">
            {tag.name} yo‘nalishidagi loyihalar — {projects.length} ta
          </p>
        </div>
      </div>

      <div className="mt-8">
        {projects.length === 0 ? (
          <EmptyState
            title={`Hali ${tag.name} tagida loyiha yo‘q`}
            text="Birinchi bo‘lib shu yo‘nalishda loyiha joylang — u shu sahifada va qidiruvda ko‘rinadi."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={{
                  ...p,
                  isWinner: winnerIds.has(p.id) || undefined,
                  isTrending: trendingIds.has(p.id) || undefined
                }}
              />
            ))}
          </div>
        )}
      </div>

      {popularTags.length > 0 && (
        <section className="mt-14 border-t border-line pt-8" aria-label="Boshqa yo‘nalishlar">
          <h2 className="text-lg font-extrabold tracking-tight">
            Boshqa yo‘nalishlar
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {popularTags
              .filter((t) => t.slug !== tag.slug)
              .map((t) => (
                <Link
                  key={t.id}
                  href={`/tags/${t.slug}`}
                  className={cn("chip transition hover:text-ink")}
                >
                  {t.name}
                  <span className="ml-1.5 text-xs font-bold text-muted">
                    {t.project_count}
                  </span>
                </Link>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
