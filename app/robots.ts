import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/orders/", "/saved", "/auth/"] },
    sitemap: `${base}/sitemap.xml`
  };
}
