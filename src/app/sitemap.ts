import type { MetadataRoute } from "next";
import { getPublishedProjects } from "@/lib/queries";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { projects } = await getPublishedProjects();
  const latest = projects.reduce((d, p) => (p.updatedAt > d ? p.updatedAt : d), "2026-01-01T00:00:00.000Z");
  return [
    { url: base, lastModified: latest, changeFrequency: "monthly", priority: 1 },
    ...projects.map((p) => ({ url: `${base}/work/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
