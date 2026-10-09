import { readContent } from "./store";
import type { Content, MediaAsset, Project, ResolvedProject } from "./types";

export const pad = (n: number, len = 2) => String(n).padStart(len, "0");

export function mediaMap(content: Content) {
  return new Map(content.media.map((m) => [m.id, m]));
}

export function resolveProject(p: Project, content: Content, index: number): ResolvedProject {
  const m = mediaMap(content);
  return {
    ...p,
    number: pad(index + 1),
    cover: p.coverId ? m.get(p.coverId) : undefined,
    coverVideo: p.coverVideoId ? m.get(p.coverVideoId) : undefined,
    categories: content.categories.filter((c) => p.categoryIds.includes(c.id)).sort((a, b) => a.order - b.order),
  };
}

/** Published projects in editorial order, numbered 001… */
export async function getPublishedProjects() {
  const content = await readContent();
  const list = content.projects.filter((p) => p.published).sort((a, b) => a.order - b.order);
  return { content, projects: list.map((p, i) => resolveProject(p, content, i)) };
}

export async function getHomeData() {
  const { content, projects } = await getPublishedProjects();
  const byId = new Map(projects.map((p) => [p.id, p]));
  const ordered = content.settings.selectedWork.featuredOrder
    .map((id) => byId.get(id))
    .filter((p): p is ResolvedProject => !!p && p.featured);
  // Featured projects not yet placed in the order list go last.
  for (const p of projects) if (p.featured && !ordered.includes(p)) ordered.push(p);
  const m = mediaMap(content);
  return {
    settings: content.settings,
    categories: [...content.categories].sort((a, b) => a.order - b.order),
    featured: ordered.slice(0, 6),
    archive: projects,
    media: Object.fromEntries(m) as Record<string, MediaAsset>,
  };
}

export async function getProjectBySlug(slug: string) {
  const { content, projects } = await getPublishedProjects();
  const i = projects.findIndex((p) => p.slug === slug);
  if (i === -1) return null;
  const next = projects.length > 1 ? projects[(i + 1) % projects.length] : null;
  return {
    project: projects[i],
    next,
    settings: content.settings,
    media: Object.fromEntries(mediaMap(content)) as Record<string, MediaAsset>,
  };
}

export async function getSettings() {
  return (await readContent()).settings;
}
