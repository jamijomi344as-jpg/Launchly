import type { Metadata } from "next";
import OrderExplorer from "@/components/order-explorer";
import { NotConfiguredState } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/config";

export const metadata: Metadata = {
  title: "Buyurtma bozori",
  description:
    "Ochiq buyurtmalar: bizneslar ish topshiradi, dasturchilar taklif yuboradi. Kontaktlar faqat tomonlarga ochiladi.",
  openGraph: { title: "Buyurtma bozori", type: "website" }
};

export default function MarketplacePage() {
  return (
    <div className="container-site py-10">
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Buyurtma bozori
        </h1>
        <p className="mt-1 text-sm text-muted">
          Buyurtma bering yoki taklif yuboring — kontakt ma’lumotlari faqat tomonlarga
          ko‘rinadi.
        </p>
      </div>
      {isSupabaseConfigured() ? (
        <OrderExplorer />
      ) : (
        <NotConfiguredState feature="Buyurtma bozori" />
      )}
    </div>
  );
}
