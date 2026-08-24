import type { Metadata } from "next";
import Link from "next/link";
import { Rocket } from "lucide-react";
import { createServerSupabase, getServerUser } from "@/lib/supabase-server";
import ProjectForm from "@/components/project-form";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = {
  title: "Loyiha joylash",
  description: "Loyihangizni Launchly‘ga joylang — screenshotlar, demo va tavsif bilan.",
  openGraph: { title: "Loyiha joylash", type: "website" }
};

export default async function NewProjectPage() {
  const user = await getServerUser();

  let profile: { role: string } | null = null;
  if (user) {
    const supabase = createServerSupabase();
    if (supabase) {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      profile = data;
    }
  }

  return (
    <div className="container-site py-10">
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Loyihani joylash
        </h1>
        <p className="mt-1 text-sm text-muted">
          Loyihangizni taqdim eting — screenshotlar, demo havola va to‘liq tavsif bilan.
        </p>
      </div>

      {!user ? (
        <EmptyState
          title="Loyiha joylash uchun tizimga kiring"
          text="Loyihalarni faqat ro‘yxatdan o‘tgan foydalanuvchilar joylaydi. Hisobingiz bormi? Kiring."
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
      ) : profile?.role !== "developer" ? (
        <EmptyState
          icon={<Rocket size={22} />}
          title="Loyiha joylash faqat developer roll uchun"
          text={`Siz hozir ${
            profile?.role === "investor" ? "investor" : "bilarsiz ro‘ldagi"
          } ro‘ldasiz. Loyihalarni joylash uchun developer ro‘li bilan ro‘yxatdan o‘ting.`}
          action={
            <Link href="/auth/signup" className="btn-primary">
              Developer ro‘li bilan ro‘yxatdan o‘tish
            </Link>
          }
        />
      ) : (
        <div className="max-w-2xl">
          <ProjectForm />
        </div>
      )}
    </div>
  );
}
