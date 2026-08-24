import type { MetadataRoute } from "next";
import { createServerSupabase } from "@/lib/supabase-server";
import { siteUrl } from "@/lib/config";

/**
 * SEO-friendly sitemap:
 * - home route
 * - projects with `launched` status only (database-driven)
 * - developer public profiles
 * When Supabase is not configured, only the home route is emitted.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const entries: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 }
  ];

  const supabase = createServerSupabase();
  if (!supabase) return entries;

  const [projects, profiles] = await Promise.all([
    supabase
      .from("projects")
      .select("slug, updated_at")
      .eq("status", "launched"),
    supabase.from("profiles").select("id, updated_at").eq("role", "developer")
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

  return entries;
}
