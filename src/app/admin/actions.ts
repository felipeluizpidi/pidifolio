"use server";

import { promises as fs } from "node:fs";
import path from "node:path";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminConfigProblem, clearThrottle, endSession, passwordMatches, requireAdmin, startSession, throttle } from "@/lib/auth";
import { mutate, newId, UPLOAD_DIR } from "@/lib/store";
import { findReferences } from "@/lib/media-refs";
import { parseEmbed } from "@/lib/embed";
import { projectSchema, settingsSchema, type Project } from "@/lib/types";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

function publish() {
  revalidatePath("/", "layout");
}

function fail(err: unknown): ActionResult {
  if (err instanceof z.ZodError) {
    const i = err.issues[0];
    return { ok: false, error: `${i.path.join(".") || "Field"}: ${i.message}` };
  }
  return { ok: false, error: err instanceof Error ? err.message : "Something went wrong" };
}

/* ───────────── Auth ───────────── */

export async function login(_: { error?: string } | undefined, form: FormData): Promise<{ error?: string }> {
  const problem = adminConfigProblem();
  if (problem) return { error: `Admin disabled: ${problem}` };
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  const t = throttle(ip);
  if (!t.allowed) return { error: `Too many attempts. Try again in ${t.retryInMin} min.` };
  const password = String(form.get("password") ?? "");
  if (!passwordMatches(password)) return { error: "Wrong password." };
  clearThrottle(ip);
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

/* ───────────── Projects ───────────── */

export async function createProject(): Promise<void> {
  await requireAdmin();
  const id = await mutate((c) => {
    const now = new Date().toISOString();
    const pid = newId("p");
    let slug = "untitled-project";
    let n = 2;
    while (c.projects.some((p) => p.slug === slug)) slug = `untitled-project-${n++}`;
    const p: Project = projectSchema.parse({
      id: pid,
      slug,
      title: "Untitled project",
      year: new Date().getFullYear(),
      order: Math.max(0, ...c.projects.map((x) => x.order)) + 1,
      published: false,
      demo: false,
      createdAt: now,
      updatedAt: now,
    });
    c.projects.push(p);
    return pid;
  });
  redirect(`/admin/projects/${id}`);
}

const editableProject = projectSchema.omit({ id: true, createdAt: true, updatedAt: true, order: true });

export async function saveProject(id: string, input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const data = editableProject.parse(input);
    await mutate((c) => {
      const p = c.projects.find((x) => x.id === id);
      if (!p) throw new Error("Project not found");
      if (c.projects.some((x) => x.id !== id && x.slug === data.slug)) throw new Error(`The URL slug “${data.slug}” is already used by another project`);
      const known = new Set(c.media.map((m) => m.id));
      const missing = [data.coverId, data.coverVideoId, ...data.blocks.flatMap((b) => ("assetIds" in b ? b.assetIds : "assetId" in b ? [b.assetId] : []))].filter(
        (x): x is string => !!x && !known.has(x),
      );
      if (missing.length) throw new Error("Some selected media no longer exists — reselect it");
      const validCats = new Set(c.categories.map((x) => x.id));
      Object.assign(p, data, {
        categoryIds: data.categoryIds.filter((x) => validCats.has(x)),
        updatedAt: new Date().toISOString(),
      });
      const fo = c.settings.selectedWork.featuredOrder;
      if (p.featured && !fo.includes(id)) fo.push(id);
      if (!p.featured) c.settings.selectedWork.featuredOrder = fo.filter((x) => x !== id);
    });
    publish();
    return { ok: true, message: "Saved" };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteProject(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await mutate((c) => {
      const before = c.projects.length;
      c.projects = c.projects.filter((p) => p.id !== id);
      if (c.projects.length === before) throw new Error("Project not found");
      c.settings.selectedWork.featuredOrder = c.settings.selectedWork.featuredOrder.filter((x) => x !== id);
    });
    publish();
    return { ok: true, message: "Project deleted" };
  } catch (e) {
    return fail(e);
  }
}

export async function setProjectFlag(id: string, flag: "published" | "featured", value: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    await mutate((c) => {
      const p = c.projects.find((x) => x.id === id);
      if (!p) throw new Error("Project not found");
      p[flag] = value;
      p.updatedAt = new Date().toISOString();
      const fo = c.settings.selectedWork.featuredOrder;
      if (flag === "featured") c.settings.selectedWork.featuredOrder = value ? [...fo.filter((x) => x !== id), id] : fo.filter((x) => x !== id);
    });
    publish();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function reorderProjects(ids: string[]): Promise<ActionResult> {
  try {
    await requireAdmin();
    z.array(z.string()).parse(ids);
    await mutate((c) => {
      const pos = new Map(ids.map((id, i) => [id, i + 1]));
      for (const p of c.projects) p.order = pos.get(p.id) ?? p.order + ids.length;
    });
    publish();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function reorderFeatured(ids: string[]): Promise<ActionResult> {
  try {
    await requireAdmin();
    z.array(z.string()).max(12).parse(ids);
    await mutate((c) => {
      const featured = new Set(c.projects.filter((p) => p.featured).map((p) => p.id));
      c.settings.selectedWork.featuredOrder = ids.filter((x) => featured.has(x));
    });
    publish();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* ───────────── Settings ───────────── */

export async function saveSettings(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const data = settingsSchema.parse(input);
    for (const u of [data.social.linkedin, data.social.behance, data.cv.url].filter(Boolean)) {
      if (!/^https:\/\//.test(u!)) throw new Error(`Links must start with https:// (${u})`);
    }
    await mutate((c) => {
      const known = new Set(c.media.map((m) => m.id));
      for (const ref of [data.hero.portraitDesktopId, data.hero.portraitMobileId, data.about.portraitId, data.cv.assetId]) {
        if (ref && !known.has(ref)) throw new Error("A selected image no longer exists — reselect it");
      }
      // featured order is managed from the Projects screen
      c.settings = { ...data, selectedWork: { ...data.selectedWork, featuredOrder: c.settings.selectedWork.featuredOrder } };
    });
    publish();
    return { ok: true, message: "Settings saved" };
  } catch (e) {
    return fail(e);
  }
}

/* ───────────── Media ───────────── */

const mediaPatch = z.object({
  alt: z.string().max(300),
  caption: z.string().max(300).optional(),
  posterId: z.string().optional(),
});

export async function updateMedia(id: string, input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const data = mediaPatch.parse(input);
    await mutate((c) => {
      const m = c.media.find((x) => x.id === id);
      if (!m) throw new Error("Media not found");
      if (data.posterId) {
        const poster = c.media.find((x) => x.id === data.posterId);
        if (!poster || poster.kind !== "image") throw new Error("Poster must be an image");
      }
      m.alt = data.alt;
      m.caption = data.caption || undefined;
      if (m.kind === "video" || m.kind === "embed") m.posterId = data.posterId || undefined;
    });
    publish();
    return { ok: true, message: "Saved" };
  } catch (e) {
    return fail(e);
  }
}

export async function addRemoteVideo(url: string, alt: string): Promise<ActionResult & { id?: string }> {
  try {
    await requireAdmin();
    const parsed = parseEmbed(url.trim());
    if (!parsed) throw new Error("Paste a YouTube or Vimeo link");
    const id = await mutate((c) => {
      const mid = newId("m");
      c.media.unshift({
        id: mid,
        kind: "embed",
        src: url.trim(),
        provider: parsed.provider,
        alt: alt.trim() || `${parsed.provider} video`,
        width: 1920,
        height: 1080,
        origin: "remote",
        createdAt: new Date().toISOString(),
      });
      return mid;
    });
    publish();
    return { ok: true, message: "Video link added", id };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteMedia(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const file = await mutate((c) => {
      const m = c.media.find((x) => x.id === id);
      if (!m) throw new Error("Media not found");
      const refs = findReferences(c, id);
      if (refs.length) throw new Error(`Still in use: ${refs.join("; ")}`);
      c.media = c.media.filter((x) => x.id !== id);
      return m.origin === "upload" ? path.basename(m.src) : null;
    });
    if (file) await fs.rm(path.join(UPLOAD_DIR, file), { force: true });
    publish();
    return { ok: true, message: "Deleted" };
  } catch (e) {
    return fail(e);
  }
}
