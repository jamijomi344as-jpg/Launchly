import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Launchly — O'zbek loyihalarining eng yaxshi manzili",
  description: "O'zbekiston dasturchilari va startapchilari uchun loyiha, feedback va buyurtmalar platformasi.",
  openGraph: {
    title: "Launchly — Loyihangizni dunyoga ko'rsating",
    description: "O'zbek dasturchilarining loyihalarini kashf qiling, roast qiling va qo'llab-quvvatlang.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
