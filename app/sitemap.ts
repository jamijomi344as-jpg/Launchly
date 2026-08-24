import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://launchly.uz";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/p/flowmap`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/p/ovozai`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 }
  ];
}
