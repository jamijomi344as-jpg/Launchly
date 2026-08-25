import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import EnvBanner from "@/components/env-banner";
import Onboarding from "@/components/onboarding";
import { createServerSupabase, getServerUser } from "@/lib/supabase-server";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Launchly — O‘zbek loyihalar, mahsulotlar va buyurtmalar platformasi",
    template: "%s · Launchly"
  },
  description:
    "O‘zbekiston dasturchilari, startapchilari va investorlari uchun loyiha showcase, samimiy feedback va buyurtmalar bozori.",
  openGraph: {
    title: "Launchly — Loyihangizni dunyoga ko‘rsating",
    description:
      "O‘zbek dasturchilarining loyihalarini kashf qiling, samimiy feedback bering va buyurtma bozorida hamkor toping.",
    type: "website",
    locale: "uz_UZ",
    siteName: "Launchly"
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0e131a" }
  ]
};

const themeScript = `(function(){try{var t=localStorage.getItem('launchly-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getServerUser();

  let profile: { full_name: string; avatar_url: string | null; role: string } | null =
    null;
  if (user) {
    const supabase = createServerSupabase();
    if (supabase) {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, role")
        .eq("id", user.id)
        .maybeSingle();
      profile = data;
    }
  }

  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <EnvBanner />
        <Nav
          user={
            user
              ? {
                  id: user.id,
                  name: profile?.full_name || user.email || null,
                  avatar: profile?.avatar_url ?? null,
                  role: profile?.role ?? null
                }
              : null
          }
        />
        <main className="flex-1">{children}</main>
        <Footer />
        <Onboarding />
      </body>
    </html>
  );
}
