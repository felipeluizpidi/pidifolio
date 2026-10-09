import { z } from "zod";

/* ───────────────────────── Media ───────────────────────── */

export const mediaKind = z.enum(["image", "video", "embed", "file"]);
export type MediaKind = z.infer<typeof mediaKind>;

export const mediaAssetSchema = z.object({
  id: z.string(),
  kind: mediaKind,
  /** Local path (/media/… or /placeholders/…) or remote embed URL */
  src: z.string(),
  /** Optional poster asset id (videos / embeds) */
  posterId: z.string().optional(),
  alt: z.string().default(""),
  caption: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  mime: z.string().optional(),
  size: z.number().int().nonnegative().optional(),
  provider: z.enum(["youtube", "vimeo"]).optional(),
  /** Uploaded files can be deleted from disk; placeholders cannot */
  origin: z.enum(["upload", "remote", "placeholder"]),
  createdAt: z.string(),
});
export type MediaAsset = z.infer<typeof mediaAssetSchema>;

/* ───────────────────────── Blocks ───────────────────────── */

const id = z.string();
export const blockSchema = z.discriminatedUnion("type", [
  z.object({ id, type: z.literal("image"), assetId: z.string(), caption: z.string().optional() }),
  z.object({ id, type: z.literal("video"), assetId: z.string(), caption: z.string().optional(), autoplay: z.boolean().default(false) }),
  z.object({ id, type: z.literal("grid2"), assetIds: z.array(z.string()) }),
  z.object({ id, type: z.literal("grid3"), assetIds: z.array(z.string()) }),
  z.object({ id, type: z.literal("asymmetric"), assetIds: z.array(z.string()) }),
  z.object({
    id,
    type: z.literal("imageText"),
    assetId: z.string(),
    heading: z.string().optional(),
    text: z.string(),
    side: z.enum(["left", "right"]).default("left"),
  }),
  z.object({ id, type: z.literal("filmstrip"), assetIds: z.array(z.string()) }),
  z.object({ id, type: z.literal("gallery"), assetIds: z.array(z.string()) }),
  z.object({ id, type: z.literal("embed"), url: z.string().url(), caption: z.string().optional() }),
  z.object({ id, type: z.literal("text"), heading: z.string().optional(), body: z.string(), size: z.enum(["lg", "xl"]).default("lg") }),
]);
export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block["type"];

/* ───────────────────────── Projects ───────────────────────── */

export const featuredLayout = z.enum(["fullbleed", "split", "poster", "sequence"]);
export const archiveShape = z.enum(["poster", "landscape", "square", "type"]);

export const creditSchema = z.object({ role: z.string(), name: z.string() });

/**
 * The site's fixed palette (red, orange, ivory on ink) — case accents never introduce new colors.
 * Ink is the page background, so it can't be an accent; blue/mint tokens are not part of the visual palette.
 */
export const ACCENT_PALETTE = ["#EF2917", "#FF6030", "#F4E9D6"];

export const projectSchema = z.object({
  id: z.string(),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens"),
  title: z.string().min(1).max(80),
  subtitle: z.string().max(120).default(""),
  client: z.string().max(80).default(""),
  year: z.number().int().min(1990).max(2100),
  role: z.string().max(120).default(""),
  disciplines: z.array(z.string()).default([]),
  categoryIds: z.array(z.string()).default([]),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#EF2917"),
  coverId: z.string().optional(),
  coverVideoId: z.string().optional(),
  /** Which side of the cover survives when a layout crops it */
  coverFocus: z.enum(["left", "center", "right"]).default("center"),
  featured: z.boolean().default(false),
  featuredLayout: featuredLayout.default("fullbleed"),
  archiveShape: archiveShape.default("landscape"),
  published: z.boolean().default(false),
  order: z.number().int().default(0),
  overview: z.string().default(""),
  challenge: z.string().default(""),
  concept: z.string().default(""),
  process: z.string().default(""),
  /** Only verified, supplied results. Empty = section hidden. */
  outcomes: z.string().default(""),
  credits: z.array(creditSchema).default([]),
  blocks: z.array(blockSchema).default([]),
  /** Seed content that should be replaced with real work */
  demo: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Project = z.infer<typeof projectSchema>;

/* ───────────────────────── Categories ───────────────────────── */

export const categorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  index: z.string(),
  title: z.string(),
  filterLabel: z.string(),
  description: z.string(),
  order: z.number().int(),
});
export type Category = z.infer<typeof categorySchema>;

/* ───────────────────────── Settings ───────────────────────── */

export const settingsSchema = z.object({
  name: z.object({ first: z.string(), last: z.string(), full: z.string() }),
  role: z.string(),
  hero: z.object({
    roleLines: z.array(z.string()),
    lead: z.string(),
    meta: z.array(z.string()),
    cta: z.string(),
    portraitDesktopId: z.string().optional(),
    portraitMobileId: z.string().optional(),
  }),
  selectedWork: z.object({ headline: z.array(z.string()), subtitle: z.string(), featuredOrder: z.array(z.string()) }),
  archive: z.object({ headline: z.array(z.string()), subtitle: z.string() }),
  /** Photography card + filter in the Archive (opens a lightbox); photos are picked in /admin → Settings. */
  photography: z
    .object({ headline: z.array(z.string()), subtitle: z.string(), photoIds: z.array(z.string()) })
    .default({ headline: ["Photography"], subtitle: "", photoIds: [] }),
  about: z.object({
    headline: z.array(z.string()),
    portraitId: z.string().optional(),
    bio: z.array(z.string()),
    disciplines: z.array(z.string()),
    metrics: z.array(z.object({ value: z.string(), label: z.string() })),
  }),
  contact: z.object({
    headline: z.array(z.string()),
    copy: z.string(),
    email: z.string().email().or(z.literal("")),
    location: z.string(),
    availability: z.string(),
  }),
  social: z.object({
    linkedin: z.string(),
    behance: z.string(),
    instagram: z.string().optional(),
    /** Digits only, with country code — e.g. 5511983829395 */
    whatsapp: z.string().regex(/^\d{10,15}$/, "WhatsApp: digits only, with country code").or(z.literal("")).optional(),
  }),
  cv: z.object({ assetId: z.string().optional(), url: z.string().optional() }),
  footer: z.object({ signature: z.string(), tagline: z.string() }),
  seo: z.object({ title: z.string(), description: z.string() }),
});
export type Settings = z.infer<typeof settingsSchema>;

/* ───────────────────────── Store ───────────────────────── */

export const contentSchema = z.object({
  version: z.literal(1),
  settings: settingsSchema,
  categories: z.array(categorySchema),
  projects: z.array(projectSchema),
  media: z.array(mediaAssetSchema),
});
export type Content = z.infer<typeof contentSchema>;

/* ───────────────────────── Contact messages ───────────────────────── */

export const contactMessageInput = z.object({
  name: z.string().trim().min(2, "Please tell me your name").max(120),
  email: z.string().trim().email("That email doesn't look right").max(200),
  message: z.string().trim().min(10, "A few more words, please").max(4000),
});

export const contactMessageSchema = contactMessageInput.extend({
  id: z.string(),
  createdAt: z.string(),
  read: z.boolean().default(false),
});
export type ContactMessage = z.infer<typeof contactMessageSchema>;

/** Project with its resolved media, as consumed by public pages */
export type ResolvedProject = Project & {
  number: string;
  cover?: MediaAsset;
  coverVideo?: MediaAsset;
  categories: Category[];
};
