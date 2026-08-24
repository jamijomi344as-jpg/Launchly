import type { Metadata } from "next";
import ProductExplorer from "@/components/product-explorer";
import { NotConfiguredState } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/config";

export const metadata: Metadata = {
  title: "Mahsulotlar",
  description:
    "O‘zbek dasturchilari tomonidan ishga tushirilgan mahsulotlar vitrinası — bepul va pullik.",
  openGraph: { title: "Mahsulot vitrinası", type: "website" }
};

export default function ProductsPage() {
  return (
    <div className="container-site py-10">
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Mahsulot vitrinası
        </h1>
        <p className="mt-1 text-sm text-muted">
          Ishga tushirilgan mahsulotlar — Supabase’dagi real ma’lumotlar.
        </p>
      </div>
      {isSupabaseConfigured() ? (
        <ProductExplorer />
      ) : (
        <NotConfiguredState feature="Mahsulotlar bo‘limi" />
      )}
    </div>
  );
}
