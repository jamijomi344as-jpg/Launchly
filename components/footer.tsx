import Link from "next/link";
import IntroTrigger from "@/components/intro-trigger";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-site flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white">
            <span className="absolute h-2 w-2 rounded-full border-2 border-white/90" />
          </span>
          <div>
            <p className="text-sm font-extrabold tracking-tight">
              launchly<span className="text-accent">.</span>
            </p>
            <p className="text-xs text-muted">
              O‘zbek loyihalari, mahsulotlari va buyurtmalari platformasi
            </p>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted" aria-label="Pastki menyu">
          <Link className="transition hover:text-accent" href="/projects">
            Loyihalar
          </Link>
          <Link className="transition hover:text-accent" href="/products">
            Mahsulotlar
          </Link>
          <Link className="transition hover:text-accent" href="/marketplace">
            Buyurtma bozori
          </Link>
          <Link className="transition hover:text-accent" href="/dashboard">
            Dashboard
          </Link>
          <IntroTrigger className="transition hover:text-accent" />
        </nav>
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} Launchly. Barcha huquqlar himoyalangan.
        </p>
      </div>
    </footer>
  );
}
