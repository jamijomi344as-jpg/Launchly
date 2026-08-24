import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import ProjectExplorer from "@/components/project-explorer";
import { NotConfiguredState } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/config";

export const metadata: Metadata = {
  title: "Loyihalar",
  description:
    "O‘zbek dasturchilari loyihalarini qidiring, filtrlang va samimiy feedback bering.",
  openGraph: { title: "Loyihalar", type: "website" }
};

export default function ProjectsPage() {
  return (
    <div className="container-site py-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Loyihalar</h1>
          <p className="mt-1 text-sm text-muted">
            Qidiruv, kategoriya va holat filtrlari bilan real Supabase ma’lumotlari.
          </p>
        </div>
        <Link href="/projects/new" className="btn-primary">
          <Plus size={15} /> Loyiha joylash
        </Link>
      </div>
      {isSupabaseConfigured() ? (
        <ProjectExplorer />
      ) : (
        <NotConfiguredState feature="Loyihalar bo‘limi" />
      )}
    </div>
  );
}
