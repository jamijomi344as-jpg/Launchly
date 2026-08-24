import type {
  OrderStatus,
  OwnerRef,
  Project,
  ProjectCardData,
  ProposalStatus,
  ProjectStatus,
  Tag,
  UserRole
} from "./types";

export function cn(
  ...parts: Array<string | number | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}

const MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentyabr",
  "oktabr",
  "noyabr",
  "dekabr"
];

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getDate()}-${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function timeAgo(value: string | null | undefined): string {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "hozirgina";
  if (min < 60) return `${min} daqiqa oldin`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} soat oldin`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} kun oldin`;
  return formatDate(value);
}

export function formatCompact(n: number | null | undefined): string {
  const v = n ?? 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(v);
}

export function formatMoney(value: number | null | undefined): string {
  if (value == null) return "—";
  return `$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function formatBudget(
  min: number | null | undefined,
  max: number | null | undefined
): string {
  if (min == null && max == null) return "Kelishilgan";
  if (min == null) return `gacha ${formatMoney(max)}`;
  if (max == null) return `${formatMoney(min)} dan yuqori`;
  return `${formatMoney(min)} — ${formatMoney(max)}`;
}

export function initials(name: string | null | undefined): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  return parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Maps a raw Supabase row (with embedded profiles/comments/ratings/tags) to card data. */
export function withProjectMetrics(
  row: Project & {
    profiles?: OwnerRef | null;
    project_comments?: Array<{ id: string }>;
    project_ratings?: Array<{
      idea_score: number;
      design_score: number;
      execution_score: number;
    }>;
    project_tags?: Array<{ tags: Tag | null }>;
  }
): ProjectCardData {
  const ratings = row.project_ratings ?? [];
  const ratingAvg =
    ratings.length > 0
      ? ratings.reduce(
          (sum, r) => sum + (r.idea_score + r.design_score + r.execution_score) / 3,
          0
        ) / ratings.length
      : null;
  return {
    ...row,
    profiles: row.profiles ?? null,
    ratingAvg:
      ratingAvg == null ? null : Math.round(ratingAvg * 10) / 10,
    ratingCount: ratings.length,
    commentCount: (row.project_comments ?? []).length,
    tags: (row.project_tags ?? [])
      .map((pt) => pt.tags)
      .filter((t): t is Tag => t != null)
  };
}

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  idea: "G‘oya",
  mvp: "MVP",
  in_progress: "Jarayonda",
  launched: "Ishga tushgan"
};

export const PROJECT_STATUS_STYLE: Record<ProjectStatus, string> = {
  idea: "bg-surface-2 text-muted",
  mvp: "bg-accent-soft text-accent",
  in_progress: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  launched: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: "Yangi",
  proposals: "Takliflar kutilmoqda",
  selected: "Dasturchi tanlandi",
  in_progress: "Ijroda",
  completed: "Yakunlandi"
};

export const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  new: "bg-surface-2 text-muted",
  proposals: "bg-accent-soft text-accent",
  selected: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  in_progress: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  completed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
};

export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  pending: "Kutilmoqda",
  accepted: "Qabul qilindi",
  rejected: "Rad etildi"
};

export const PROPOSAL_STATUS_STYLE: Record<ProposalStatus, string> = {
  pending: "bg-surface-2 text-muted",
  accepted: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-rose-500/15 text-rose-600 dark:text-rose-400"
};

export const ROLE_LABEL: Record<UserRole, string> = {
  developer: "Dasturchi",
  investor: "Investor",
  admin: "Administrator"
};

export const ROLE_STYLE: Record<UserRole, string> = {
  developer: "bg-accent-soft text-accent",
  investor: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  admin: "bg-rose-500/15 text-rose-600 dark:text-rose-400"
};

export const PROJECT_CATEGORIES = [
  "SaaS",
  "Sun'iy intellekt",
  "Veb-ilova",
  "Mobil ilova",
  "E-commerce",
  "Ta'lim",
  "Marketplace",
  "Dizayn",
  "Boshqa"
];
