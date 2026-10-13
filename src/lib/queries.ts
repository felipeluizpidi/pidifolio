import { readContent } from "./store";
import type { Block, Category, Content, MediaAsset, Project, ResolvedProject, Settings } from "./types";
import { defaultLocale, type Locale } from "./i18n";
import ptTranslations from "./translations/pt.json";
import esTranslations from "./translations/es.json";

type ProjectTranslation = Partial<{
  subtitle: string;
  role: string;
  disciplines: string[];
  overview: string;
  challenge: string;
  concept: string;
  process: string;
  outcomes: string;
  creditRoles: Record<string, string>;
  blocks: Record<string, Partial<{ heading: string; body: string; text: string; caption: string }>>;
}>;

type CategoryTranslation = Partial<{ title: string; filterLabel: string; description: string }>;

type SettingsTranslation = Partial<{
  role: string;
  hero: Partial<{ roleLines: string[]; lead: string; meta: string[]; cta: string }>;
  selectedWork: Partial<{ headline: string[]; subtitle: string }>;
  archive: Partial<{ headline: string[]; subtitle: string }>;
  about: Partial<{ headline: string[]; bio: string[]; disciplines: string[]; metrics: { label: string }[] }>;
  contact: Partial<{ headline: string[]; copy: string; availability: string }>;
  footer: Partial<{ signature: string; tagline: string }>;
  seo: Partial<{ title: string; description: string }>;
}>;

type Translations = { settings?: SettingsTranslation; categories?: Record<string, CategoryTranslation>; projects?: Record<string, ProjectTranslation> };

const TRANSLATIONS: Partial<Record<Locale, Translations>> = {
  pt: ptTranslations as Translations,
  es: esTranslations as Translations,
};

export const pad = (n: number, len = 2) => String(n).padStart(len, "0");

export function mediaMap(content: Content) {
  return new Map(content.media.map((m) => [m.id, m]));
}

function translateBlock(b: Block, t?: ProjectTranslation["blocks"]): Block {
  const tb = t?.[b.id];
  if (!tb) return b;
  const next = { ...b } as Block & Partial<{ heading: string; body: string; text: string; caption: string }>;
  if ("heading" in next && tb.heading) next.heading = tb.heading;
  if ("body" in next && tb.body) next.body = tb.body;
  if ("text" in next && tb.text) next.text = tb.text;
  if ("caption" in next && tb.caption) next.caption = tb.caption;
  return next;
}

function translateProject(p: Project, locale: Locale): Project {
  const t = TRANSLATIONS[locale]?.projects?.[p.id];
  if (!t) return p;
  return {
    ...p,
    subtitle: t.subtitle ?? p.subtitle,
    role: t.role ?? p.role,
    disciplines: t.disciplines ?? p.disciplines,
    overview: t.overview ?? p.overview,
    challenge: t.challenge ?? p.challenge,
    concept: t.concept ?? p.concept,
    process: t.process ?? p.process,
    outcomes: t.outcomes ?? p.outcomes,
    credits: p.credits.map((c) => ({ ...c, role: t.creditRoles?.[c.role] ?? c.role })),
    blocks: p.blocks.map((b) => translateBlock(b, t.blocks)),
  };
}

function translateCategory(c: Category, locale: Locale): Category {
  const t = TRANSLATIONS[locale]?.categories?.[c.id];
  if (!t) return c;
  return { ...c, title: t.title ?? c.title, filterLabel: t.filterLabel ?? c.filterLabel, description: t.description ?? c.description };
}

function translateSettings(s: Settings, locale: Locale): Settings {
  const t = TRANSLATIONS[locale]?.settings;
  if (!t) return s;
  return {
    ...s,
    role: t.role ?? s.role,
    hero: { ...s.hero, roleLines: t.hero?.roleLines ?? s.hero.roleLines, lead: t.hero?.lead ?? s.hero.lead, meta: t.hero?.meta ?? s.hero.meta, cta: t.hero?.cta ?? s.hero.cta },
    selectedWork: { ...s.selectedWork, headline: t.selectedWork?.headline ?? s.selectedWork.headline, subtitle: t.selectedWork?.subtitle ?? s.selectedWork.subtitle },
    archive: { ...s.archive, headline: t.archive?.headline ?? s.archive.headline, subtitle: t.archive?.subtitle ?? s.archive.subtitle },
    about: {
      ...s.about,
      headline: t.about?.headline ?? s.about.headline,
      bio: t.about?.bio ?? s.about.bio,
      disciplines: t.about?.disciplines ?? s.about.disciplines,
      metrics: s.about.metrics.map((m, i) => ({ value: m.value, label: t.about?.metrics?.[i]?.label ?? m.label })),
    },
    contact: { ...s.contact, headline: t.contact?.headline ?? s.contact.headline, copy: t.contact?.copy ?? s.contact.copy, availability: t.contact?.availability ?? s.contact.availability },
    footer: { ...s.footer, signature: t.footer?.signature ?? s.footer.signature, tagline: t.footer?.tagline ?? s.footer.tagline },
    seo: { ...s.seo, title: t.seo?.title ?? s.seo.title, description: t.seo?.description ?? s.seo.description },
  };
}

export function resolveProject(p: Project, content: Content, index: number, locale: Locale = defaultLocale): ResolvedProject {
  const m = mediaMap(content);
  const translated = translateProject(p, locale);
  return {
    ...translated,
    number: pad(index + 1),
    cover: p.coverId ? m.get(p.coverId) : undefined,
    coverVideo: p.coverVideoId ? m.get(p.coverVideoId) : undefined,
    pageCover: p.pageCoverId ? m.get(p.pageCoverId) : p.coverId ? m.get(p.coverId) : undefined,
    categories: content.categories
      .filter((c) => p.categoryIds.includes(c.id))
      .sort((a, b) => a.order - b.order)
      .map((c) => translateCategory(c, locale)),
  };
}

/** Published projects in editorial order, numbered 001… */
export async function getPublishedProjects(locale: Locale = defaultLocale) {
  const content = await readContent();
  const list = content.projects.filter((p) => p.published).sort((a, b) => a.order - b.order);
  return { content, projects: list.map((p, i) => resolveProject(p, content, i, locale)) };
}

export async function getHomeData(locale: Locale = defaultLocale) {
  const { content, projects } = await getPublishedProjects(locale);
  const byId = new Map(projects.map((p) => [p.id, p]));
  const ordered = content.settings.selectedWork.featuredOrder
    .map((id) => byId.get(id))
    .filter((p): p is ResolvedProject => !!p && p.featured);
  // Featured projects not yet placed in the order list go last.
  for (const p of projects) if (p.featured && !ordered.includes(p)) ordered.push(p);
  const featured = ordered.slice(0, 6);
  const m = mediaMap(content);
  return {
    settings: translateSettings(content.settings, locale),
    categories: [...content.categories].sort((a, b) => a.order - b.order).map((c) => translateCategory(c, locale)),
    featured,
    // Every project appears in the Archive too, but the ones already on Selected Work
    // are deprioritized — the rest of the catalogue comes first, these come last.
    archive: [...projects.filter((p) => !featured.includes(p)), ...projects.filter((p) => featured.includes(p))],
    media: Object.fromEntries(m) as Record<string, MediaAsset>,
  };
}

export async function getProjectBySlug(slug: string, locale: Locale = defaultLocale) {
  const { content, projects } = await getPublishedProjects(locale);
  const i = projects.findIndex((p) => p.slug === slug);
  if (i === -1) return null;
  const next = projects.length > 1 ? projects[(i + 1) % projects.length] : null;
  return {
    project: projects[i],
    next,
    settings: translateSettings(content.settings, locale),
    media: Object.fromEntries(mediaMap(content)) as Record<string, MediaAsset>,
  };
}

export async function getSettings(locale: Locale = defaultLocale) {
  return translateSettings((await readContent()).settings, locale);
}
