import type { MetadataRoute } from "next";
import { createServerSupabase } from "@/lib/supabase-server";
import { siteUrl } from "@/lib/config";

/**
 * SEO-friendly sitemap:
 * - home route
 * - projects with `launched` status only (database-driven)
 * - developer public profiles
 * - tag catalog pages (/tags/[slug])
 * When Supabase is not configured, only the home route is emitted.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const entries: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 }
  ];

  const supabase = createServerSupabase();
  if (!supabase) return entries;

  const [projects, profiles, tags] = await Promise.all([
    supabase
      .from("projects")
      .select("slug, updated_at")
      .eq("status", "launched"),
    supabase.from("profiles").select("id, updated_at").eq("role", "developer"),
    // 20260901_tags_and_ranking.sql migratsiyasidan keyin mavjud bo'ladi;
    // xatolik bo'lsa sitemap tagsiz chiqadi.
    supabase
      .from("tags")
      .select("slug")
      .then((r) => ({ data: r.data as Array<{ slug: string }> | null }))
  ]);

  for (const p of projects.data ?? []) {
    entries.push({
      url: `${base}/p/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "weekly",
      priority: 0.8
    });
  }
  for (const p of profiles.data ?? []) {
    entries.push({
      url: `${base}/u/${p.id}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "weekly",
      priority: 0.5
    });
  }
  for (const t of tags.data ?? []) {
    entries.push({
      url: `${base}/tags/${t.slug}`,
      changeFrequency: "weekly",
      priority: 0.6
    });
  }

  return entries;
}
