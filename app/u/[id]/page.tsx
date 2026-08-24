import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, Globe, Linkedin, Mail, Phone, Rocket, Star, Trophy } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase-server";
import { siteUrl } from "@/lib/config";
import type { Profile, ProjectCardData } from "@/lib/types";
import {
  cn,
  formatDate,
  initials,
  ROLE_LABEL,
  ROLE_STYLE,
  withProjectMetrics
} from "@/lib/utils";
import ProjectCard from "@/components/project-card";
import { EmptyState } from "@/components/ui";

async function fetchProfile(id: string) {
  const supabase = createServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return data as Profile;
}

export async function generateMetadata({
  params
}: {
  params: { id: string }
}): Promise<Metadata> {
  const profile = await fetchProfile(params.id);
  if (!profile) {
    return { title: "Profil topilmadi" };
  }
  const name = profile.full_name || "Foydalanuvchi";
  return {
    title: name,
    robots: { index: false },
    description:
      profile.bio ||
      `${name} — Launchly ${ROLE_LABEL[profile.role]?.toLowerCase() ?? profile.role}`,
    openGraph: {
      title: `${name} — Launchly profil`,
      description: profile.bio || ROLE_LABEL[profile.role],
      type: "profile",
      images: profile.avatar_url ? [profile.avatar_url] : []
    },
    alternates: {
      canonical: `${siteUrl()}/u/${profile.id}`
    }
  };
}

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const profile = await fetchProfile(params.id);
  if (!profile) {
    notFound();
  }

  const supabase = createServerSupabase()!;
  const { data: projectsRaw } = await supabase
    .from("projects")
    .select(
      "*, profiles(id, full_name, avatar_url, role), project_comments(id), project_ratings(idea_score, design_score, execution_score)"
    )
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false });

  const projects: ProjectCardData[] = (projectsRaw ?? []).map(withProjectMetrics);
  const links = [
    { href: profile.github_url, label: "GitHub", icon: <Rocket size={14} /> },
    { href: profile.linkedin_url, label: "LinkedIn", icon: <Linkedin size={14} /> },
    { href: profile.website_url, label: "Website", icon: <Globe size={14} /> },
    { href: profile.phone ? `tel:${profile.phone}` : null, label: "Telefon", icon: <Phone size={14} /> },
    { href: profile.email ? `mailto:${profile.email}` : null, label: "Email", icon: <Mail size={14} /> }
  ].filter((l) => l.href !== null) as Array<{ href: string; label: string; icon: React.ReactNode }>;

  return (
    <div className="container-site py-10">
      <div className="card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-accent via-accent/70 to-accent/40" />
        <div className="container-site -mt-8 px-5 pb-6 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-surface bg-accent-soft text-2xl font-black text-accent shadow-soft">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name || ""} className="h-full w-full rounded-xl object-cover" />
                ) : (
                  initials(profile.full_name)
                )}
              </span>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                    {profile.full_name || "Foydalanuvchi"}
                  </h1>
                  <span className={cn("badge", ROLE_STYLE[profile.role])}>
                    {ROLE_LABEL[profile.role] ?? profile.role}
                  </span>
                </div>
                {profile.company_name && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                    <Briefcase size={13} /> {profile.company_name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <div className="card !rounded-xl px-4 py-2.5 text-center">
                <p className="flex items-center justify-center gap-1 text-lg font-extrabold">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  {Number(profile.rating_avg || 0).toFixed(1)}
                </p>
                <p className="text-[10px] font-bold text-muted">REYTING</p>
              </div>
              <div className="card !rounded-xl px-4 py-2.5 text-center">
                <p className="flex items-center justify-center gap-1 text-lg font-extrabold">
                  <Trophy size={14} className="text-accent" />
                  {profile.completed_orders}
                </p>
                <p className="text-[10px] font-bold text-muted">BUYURTMALAR</p>
              </div>
              <div className="card !rounded-xl px-4 py-2.5 text-center">
                <p className="text-lg font-extrabold">{projects.length}</p>
                <p className="text-[10px] font-bold text-muted">LOYIHA</p>
              </div>
            </div>
          </div>

          {profile.bio && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/90">
              {profile.bio}
            </p>
          )}

          {profile.skills && profile.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {profile.skills.map((s) => (
                <span key={s} className="chip">
                  {s}
                </span>
              ))}
            </div>
          )}

          {links.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target={l.href.startsWith("http") ? "_blank" : undefined}
                  rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="btn-secondary !px-3 !py-1.5 text-xs"
                >
                  {l.icon} {l.label}
                </a>
              ))}
            </div>
          )}

          <p className="mt-4 text-xs text-muted">
            Platformada {formatDate(profile.created_at)} dan beri
          </p>
        </div>
      </div>

      <section className="mt-10" aria-label="Foydalanuvchi loyihalari">
        <h2 className="mb-4 text-xl font-extrabold tracking-tight">
          Loyihalar <span className="text-sm font-bold text-muted">({projects.length})</span>
        </h2>
        {projects.length === 0 ? (
          <EmptyState
            title="Hali loyihalar yo‘q"
            text="Bu foydalanuvchi hali loyiha joylamagan."
            action={
              <Link href="/projects" className="btn-secondary">
                Barcha loyihalarni ko‘rish
              </Link>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
