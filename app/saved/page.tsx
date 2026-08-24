import type { Metadata } from "next";
import Link from "next/link";
import SavedList from "@/components/saved-list";
import { EmptyState, NotConfiguredState } from "@/components/ui";
import { getServerUser } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/config";

export const metadata: Metadata = {
  title: "Saqlangan loyihalar",
  description: "Siz saqlab qo‘ygan loyihalar.",
  robots: { index: false },
  openGraph: { title: "Saqlangan loyihalar", type: "website" }
};

export default async function SavedPage() {
  const user = await getServerUser();

  return (
    <div className="container-site py-10">
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Saqlangan loyihalar
        </h1>
        <p className="mt-1 text-sm text-muted">Bookmark qilgan loyihalaringiz shu yerda.</p>
      </div>

      {!user ? (
        <EmptyState
          title="Saqlangan loyihalarni ko‘rish uchun tizimga kiring"
          action={
            <div className="flex gap-2">
              <Link href="/auth/login" className="btn-secondary">
                Kirish
              </Link>
              <Link href="/auth/signup" className="btn-primary">
                Ro‘yxatdan o‘tish
              </Link>
            </div>
          }
        />
      ) : !isSupabaseConfigured() ? (
        <NotConfiguredState feature="Saqlangan loyihalar" />
      ) : (
        <SavedList />
      )}
    </div>
  );
}
