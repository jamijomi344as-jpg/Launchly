import Link from "next/link";
import { ArrowRight, Eye, Flame, Heart, MessageCircle, Star } from "lucide-react";
import type { ProjectCardData } from "@/lib/types";
import { cn, formatCompact, initials, PROJECT_STATUS_LABEL, PROJECT_STATUS_STYLE } from "@/lib/utils";

/**
 * "Haftaning TOP loyihasi" — project_scores view'ining eng yuqori balli.
 * Katta banner: rasm, sarlavha, statistika va hover CTA bilan.
 */
export default function TopProjectBanner({
  project,
  score
}: {
  project: ProjectCardData;
  score: number;
}) {
  return (
    <div className="card relative overflow-hidden shadow-card">
      <Link
        href={`/p/${project.slug}`}
        className="grid gap-0 md:grid-cols-[1.25fr_1fr]"
      >
          {/* Rasm */}
          <div className="relative aspect-[16/9] overflow-hidden bg-surface-2 md:aspect-auto md:min-h-[280px]">
            {project.images && project.images.length > 0 ? (
              <img
                src={project.images[0]}
                alt={project.title}
                className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
              />
            ) : (
              <div className="flex h-full min-h-[220px] w-full items-center justify-center bg-gradient-to-br from-accent-soft via-surface-2 to-surface">
                <span className="text-6xl font-black tracking-tight text-accent/40">
                  {initials(project.title)}
                </span>
              </div>
            )}
            <span className="badge absolute left-3 top-3 bg-amber-500/90 text-white backdrop-blur">
              <Flame size={12} /> Haftaning TOP loyihasi
            </span>
          </div>

          {/* Kontent */}
          <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("badge", PROJECT_STATUS_STYLE[project.status])}>
                {PROJECT_STATUS_LABEL[project.status]}
              </span>
              <span className="badge bg-surface-2 text-muted">{project.category}</span>
              {project.tags.slice(0, 3).map((t) => (
                <span key={t.id} className="badge bg-accent-soft font-semibold text-accent">
                  {t.name}
                </span>
              ))}
            </div>

            <h2 id="top-project-title" className="text-2xl font-black tracking-tight sm:text-3xl">
              {project.title}
            </h2>
            <p className="line-clamp-2 text-sm leading-relaxed text-muted">
              {project.short_description || "Tavsif kiritilmagan"}
            </p>

            {project.profiles && (
              <p className="text-xs font-semibold text-muted">
                Muallif:{" "}
                <span className="text-ink">
                  {project.profiles.full_name || "Foydalanuvchi"}
                </span>
              </p>
            )}

            <div className="mt-1 grid grid-cols-4 gap-2 rounded-xl border border-line bg-surface-2/50 p-3 text-center">
              <div>
                <p className="flex items-center justify-center gap-1 text-sm font-extrabold">
                  <Heart size={12} className="text-rose-500" />
                  {formatCompact(project.likes_count)}
                </p>
                <p className="text-[10px] font-bold text-muted">YOQTIRISH</p>
              </div>
              <div>
                <p className="flex items-center justify-center gap-1 text-sm font-extrabold">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  {project.ratingAvg != null ? project.ratingAvg.toFixed(1) : "—"}
                </p>
                <p className="text-[10px] font-bold text-muted">REYTING</p>
              </div>
              <div>
                <p className="flex items-center justify-center gap-1 text-sm font-extrabold">
                  <MessageCircle size={12} className="text-muted" />
                  {formatCompact(project.commentCount)}
                </p>
                <p className="text-[10px] font-bold text-muted">FIKRLAR</p>
              </div>
              <div>
                <p className="flex items-center justify-center gap-1 text-sm font-extrabold">
                  <Eye size={12} className="text-muted" />
                  {formatCompact(project.views_count)}
                </p>
                <p className="text-[10px] font-bold text-muted">KO‘RISH</p>
              </div>
            </div>

            <p className="flex items-center gap-1.5 text-sm font-bold text-accent">
              Loyihani ko‘rish <ArrowRight size={15} />
            </p>
          </div>
      </Link>
    </div>
  );
}
