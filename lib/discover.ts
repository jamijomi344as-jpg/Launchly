import "server-only";
import { createServerSupabase } from "./supabase-server";
import type { ProjectCardData, Tag, TagWithCount } from "./types";
import { withProjectMetrics } from "./utils";

/**
 * Kashfiyot (discovery) uchun server-side yordamchi funksiyalar.
 * 20260901_tags_and_ranking.sql migratsiyasi hali qo'llanmagan bazalarda
 * xatolik o'rniga null / bo'sh natija qaytaradi — UI shunga mos.
 */

const PROJECT_SELECT =
  "*, profiles(id, full_name, avatar_url, role), project_comments(id), project_ratings(idea_score, design_score, execution_score), project_tags(tags(id, name, slug))";

export async function fetchProjectsByIds(ids: string[]): Promise<ProjectCardData[]> {
  if (ids.length === 0) return [];
  const supabase = createServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .in("id", ids);
  if (error || !data) return [];
  return (data ?? []).map(withProjectMetrics);
}

/** project_scores view bo'yicha eng yuqori ballli loyiha (hafta TOP banneri). */
export async function fetchTopProject(): Promise<{
  project: ProjectCardData;
  score: number;
} | null> {
  const supabase = createServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("project_scores")
    .select("project_id, score")
    .gt("score", 0)
    .order("score", { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) return null;
  const [project] = await fetchProjectsByIds([data[0].project_id]);
  return project ? { project, score: Number(data[0].score) } : null;
}

/** Mashhur taglar — loyihalar soni bilan (bosh sahifa katalog bloki). */
export async function fetchTagCounts(limit = 12): Promise<TagWithCount[]> {
  const supabase = createServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("tag_counts")
    .select("id, name, slug, project_count")
    .order("project_count", { ascending: false })
    .order("name")
    .limit(limit);
  if (error || !data) return [];
  return data as TagWithCount[];
}

/** Haftalik TOP-3'ga kirgan loyiha id'lari (🏆 badge uchun). */
export async function fetchWinnerProjectIds(): Promise<Set<string>> {
  const supabase = createServerSupabase();
  if (!supabase) return new Set();
  const { data, error } = await supabase
    .from("weekly_winners")
    .select("project_id");
  if (error || !data) return new Set();
  return new Set(data.map((w: { project_id: string }) => w.project_id));
}

/** Oxirgi 24 soatda trend bo'lgan loyiha id'lari (🔥 badge uchun). */
export async function fetchTrendingProjectIds(): Promise<Set<string>> {
  const supabase = createServerSupabase();
  if (!supabase) return new Set();
  const { data, error } = await supabase
    .from("trending_projects")
    .select("project_id");
  if (error || !data) return new Set();
  return new Set(data.map((t: { project_id: string }) => t.project_id));
}

export async function fetchTagBySlug(slug: string): Promise<Tag | null> {
  const supabase = createServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return data as Tag;
}

/** Shu tagdagi barcha loyihalar (tag sahifasi uchun). */
export async function fetchProjectsByTagId(tagId: number): Promise<ProjectCardData[]> {
  const supabase = createServerSupabase();
  if (!supabase) return [];
  const { data: links, error } = await supabase
    .from("project_tags")
    .select("project_id")
    .eq("tag_id", tagId);
  if (error || !links) return [];
  const ids = links.map((l: { project_id: string }) => l.project_id);
  const projects = await fetchProjectsByIds(ids);
  // Eng yangisi birinchi bo'lsin.
  return projects.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * O'xshash loyihalar — bir xil taglarga ega boshqa loyihalar,
 * umumiy taglar soni bo'yicha saralangan.
 */
export async function fetchSimilarProjects(
  projectId: string,
  limit = 3
): Promise<ProjectCardData[]> {
  const supabase = createServerSupabase();
  if (!supabase) return [];
  const { data: ownLinks, error } = await supabase
    .from("project_tags")
    .select("tag_id")
    .eq("project_id", projectId);
  if (error || !ownLinks || ownLinks.length === 0) return [];

  const tagIds = ownLinks.map((l: { tag_id: number }) => l.tag_id);
  const { data: otherLinks, error: err2 } = await supabase
    .from("project_tags")
    .select("project_id, tag_id")
    .in("tag_id", tagIds)
    .neq("project_id", projectId);
  if (err2 || !otherLinks || otherLinks.length === 0) return [];

  // Umumiy taglar soni bo'yicha guruhlash.
  const shared = new Map<string, number>();
  for (const link of otherLinks as Array<{ project_id: string }>) {
    shared.set(link.project_id, (shared.get(link.project_id) ?? 0) + 1);
  }
  const topIds = Array.from(shared.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  const projects = await fetchProjectsByIds(topIds);
  // topIds tartibini saqlash.
  return projects.sort(
    (a, b) => topIds.indexOf(a.id) - topIds.indexOf(b.id)
  );
}
