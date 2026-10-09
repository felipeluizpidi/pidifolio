"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { ACCENT_PALETTE, type Block, type BlockType, type Category, type MediaAsset, type MediaKind, type Project } from "@/lib/types";
import { saveProject } from "@/app/admin/actions";
import { parseEmbed } from "@/lib/embed";
import { Button, Field, Input, Notice, Section, Select, Textarea, Toggle } from "./ui";
import { MediaField, MediaPicker, MediaThumb } from "./MediaKit";
import { SortableList } from "./Sortable";

const PALETTE = ACCENT_PALETTE;

const BLOCKS: Record<BlockType, { label: string; hint: string }> = {
  image: { label: "Full-width image", hint: "One image across the page" },
  video: { label: "Full-width video", hint: "Uploaded video or YouTube/Vimeo link from the library" },
  grid2: { label: "Two-column grid", hint: "Images in pairs" },
  grid3: { label: "Three-column grid", hint: "Images in threes" },
  asymmetric: { label: "Asymmetric editorial", hint: "Up to 3 images in an offset layout" },
  imageText: { label: "Image + text", hint: "A frame with a short note" },
  filmstrip: { label: "Film strip", hint: "Horizontal scrolling sequence" },
  gallery: { label: "Lightbox gallery", hint: "Thumbnail grid that opens fullscreen" },
  embed: { label: "Embedded video (URL)", hint: "Paste a YouTube or Vimeo link" },
  text: { label: "Editorial text", hint: "Large statement or paragraph" },
};

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "project";

function newBlock(type: BlockType): Block {
  const id = `b-${crypto.randomUUID().slice(0, 8)}`;
  switch (type) {
    case "image":
      return { id, type, assetId: "" };
    case "video":
      return { id, type, assetId: "", autoplay: false };
    case "imageText":
      return { id, type, assetId: "", text: "", side: "left" };
    case "embed":
      return { id, type, url: "https://www.youtube.com/watch?v=" };
    case "text":
      return { id, type, body: "", size: "lg" };
    default:
      return { id, type, assetIds: [] };
  }
}

type Editable = Omit<Project, "id" | "createdAt" | "updatedAt" | "order">;

export function ProjectEditor({ project, categories, media: initialMedia }: { project: Project; categories: Category[]; media: MediaAsset[] }) {
  const router = useRouter();
  const { id, createdAt: _c, updatedAt, order: _o, ...rest } = project;
  const [p, setP] = useState<Editable>(rest);
  const [saved, setSaved] = useState(JSON.stringify(rest));
  const [media, setMedia] = useState(initialMedia);
  const [slugTouched, setSlugTouched] = useState(project.slug !== slugify(project.title));
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [adding, setAdding] = useState(false);
  const dirty = JSON.stringify(p) !== saved;
  const byId = useMemo(() => Object.fromEntries(media.map((m) => [m.id, m])), [media]);
  const addMedia = (a: MediaAsset) => setMedia((m) => [a, ...m]);
  const set = <K extends keyof Editable>(k: K, v: Editable[K]) => setP((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const problems = useMemo(() => {
    const out: string[] = [];
    p.blocks.forEach((b, i) => {
      if ("assetId" in b && !b.assetId) out.push(`Block ${i + 1} (${BLOCKS[b.type].label}) has no media`);
      if ("assetIds" in b && b.assetIds.length === 0) out.push(`Block ${i + 1} (${BLOCKS[b.type].label}) has no images`);
      if (b.type === "embed" && !parseEmbed(b.url)) out.push(`Block ${i + 1}: not a valid YouTube/Vimeo link`);
    });
    return out;
  }, [p.blocks]);

  const save = () =>
    start(async () => {
      if (problems.length) {
        setMsg({ kind: "error", text: problems.join(" · ") });
        return;
      }
      const r = await saveProject(id, p);
      if (r.ok) {
        setSaved(JSON.stringify(p));
        setMsg({ kind: "ok", text: `Saved — ${p.published ? "live on the site" : "draft (not published)"}` });
        router.refresh();
      } else setMsg({ kind: "error", text: r.error });
    });

  const updateBlock = (bid: string, patch: Partial<Block>) => set("blocks", p.blocks.map((b) => (b.id === bid ? ({ ...b, ...patch } as Block) : b)));

  return (
    <div className="space-y-6 pb-28">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin" className="t-meta inline-flex items-center gap-1 text-ash hover:text-ivory">
            <ArrowLeft className="h-3.5 w-3.5" /> Projects
          </Link>
          <h1 className="t-display mt-1 text-[48px] md:text-[72px]" style={{ color: p.accent }}>
            {p.title || "Untitled"}
          </h1>
          <p className="t-meta-sm text-ash">Last saved {new Date(updatedAt).toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          {p.published && (
            <Link href={`/work/${p.slug}`} target="_blank" className="t-meta inline-flex h-10 items-center border border-ivory/25 px-4 hover:border-ivory">
              View live ↗
            </Link>
          )}
        </div>
      </header>

      {p.demo && (
        <Notice kind="info">
          This project is demo content. Replace the copy and media, then switch off “Demo” below so the “Demo content” tag disappears from the page.
        </Notice>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Basics">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title">
              <Input
                value={p.title}
                maxLength={80}
                onChange={(e) => {
                  const title = e.target.value;
                  setP((x) => ({ ...x, title, slug: slugTouched ? x.slug : slugify(title) }));
                }}
              />
            </Field>
            <Field label="Subtitle / tagline">
              <Input value={p.subtitle} maxLength={120} onChange={(e) => set("subtitle", e.target.value)} />
            </Field>
            <Field label="URL slug" hint={`/work/${p.slug}`}>
              <Input
                value={p.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                }}
              />
            </Field>
            <Field label="Client">
              <Input value={p.client} onChange={(e) => set("client", e.target.value)} />
            </Field>
            <Field label="Year">
              <Input type="number" min={1990} max={2100} value={p.year} onChange={(e) => set("year", Number(e.target.value) || new Date().getFullYear())} />
            </Field>
            <Field label="Your role">
              <Input value={p.role} onChange={(e) => set("role", e.target.value)} />
            </Field>
          </div>
          <Field label="Disciplines" hint="Comma-separated — shown in metadata">
            <Input
              defaultValue={p.disciplines.join(", ")}
              onBlur={(e) =>
                set(
                  "disciplines",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
            />
          </Field>
          <div>
            <span className="t-meta-sm mb-1.5 block text-ash">Archive categories (one or more)</span>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <Toggle
                  key={c.id}
                  label={`${c.index} ${c.filterLabel}`}
                  checked={p.categoryIds.includes(c.id)}
                  onChange={(v) => set("categoryIds", v ? [...p.categoryIds, c.id] : p.categoryIds.filter((x) => x !== c.id))}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 border-t border-ivory/10 pt-4">
            <Toggle label="Published" checked={p.published} onChange={(v) => set("published", v)} />
            <Toggle label="Featured on home" checked={p.featured} onChange={(v) => set("featured", v)} />
            <Toggle label="Demo content" checked={p.demo} onChange={(v) => set("demo", v)} />
          </div>
        </Section>

        <Section title="Look & placement">
          <div>
            <span className="t-meta-sm mb-1.5 block text-ash">Accent color</span>
            <div className="flex flex-wrap items-center gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("accent", c)}
                  className={clsx("h-8 w-8 border", p.accent.toUpperCase() === c ? "border-ivory outline outline-2 outline-orange" : "border-ivory/30")}
                  style={{ background: c }}
                  aria-label={`Accent ${c}`}
                />
              ))}
              <span className="t-meta-sm text-ash">{p.accent} — site palette only</span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Selected Work layout">
              <Select value={p.featuredLayout} onChange={(e) => set("featuredLayout", e.target.value as Editable["featuredLayout"])}>
                <option value="fullbleed">Full-bleed cinematic</option>
                <option value="split">Asymmetric split</option>
                <option value="poster">Festival poster</option>
                <option value="sequence">Film-strip sequence</option>
              </Select>
            </Field>
            <Field label="Archive card shape">
              <Select value={p.archiveShape} onChange={(e) => set("archiveShape", e.target.value as Editable["archiveShape"])}>
                <option value="landscape">Landscape (wide)</option>
                <option value="poster">Vertical poster</option>
                <option value="square">Square</option>
                <option value="type">Typographic (no image)</option>
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <MediaField label="Cover image" value={p.coverId} onChange={(v) => set("coverId", v)} kinds={["image"]} media={media} onUploaded={addMedia} />
            <MediaField label="Cover video (optional, silent preview)" value={p.coverVideoId} onChange={(v) => set("coverVideoId", v)} kinds={["video"]} media={media} onUploaded={addMedia} />
          </div>
          <Field label="Cover focus" hint="Which side of the cover to keep when a layout crops it (e.g. text on the left)">
            <Select value={p.coverFocus} onChange={(e) => set("coverFocus", e.target.value as Project["coverFocus"])}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </Select>
          </Field>
        </Section>
      </div>

      <Section title="Story" hint="Empty sections are hidden on the case page.">
        <div className="grid gap-4 lg:grid-cols-2">
          {(
            [
              ["overview", "Overview"],
              ["challenge", "Creative challenge"],
              ["concept", "Concept & direction"],
              ["process", "Process"],
            ] as const
          ).map(([k, label]) => (
            <Field key={k} label={label} hint="Blank line = new paragraph">
              <Textarea rows={5} value={p[k]} onChange={(e) => set(k, e.target.value)} />
            </Field>
          ))}
        </div>
        <Field label="Outcomes" hint="Only verified results you can stand behind — one per line. Leave empty to hide the section.">
          <Textarea rows={3} value={p.outcomes} onChange={(e) => set("outcomes", e.target.value)} />
        </Field>
      </Section>

      <Section
        title="Credits"
        aside={
          <Button onClick={() => set("credits", [...p.credits, { role: "", name: "" }])}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        }
      >
        {p.credits.length === 0 && <p className="text-[13px] text-ash">No credits yet.</p>}
        {p.credits.map((c, i) => (
          <div key={i} className="flex gap-2">
            <Input placeholder="Role" value={c.role} onChange={(e) => set("credits", p.credits.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))} />
            <Input placeholder="Name" value={c.name} onChange={(e) => set("credits", p.credits.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
            <Button variant="ghost" aria-label="Remove credit" onClick={() => set("credits", p.credits.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </Section>

      <Section
        title="Case study blocks"
        hint="Drag to reorder. Every image across blocks joins one fullscreen lightbox sequence."
        aside={
          <div className="relative">
            <Button variant="primary" onClick={() => setAdding((v) => !v)} aria-expanded={adding}>
              <Plus className="h-3.5 w-3.5" /> Add block
            </Button>
            {adding && (
              <ul className="absolute right-0 top-11 z-30 w-72 border border-ivory/20 bg-ink py-1 shadow-2xl">
                {(Object.keys(BLOCKS) as BlockType[]).map((t) => (
                  <li key={t}>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left hover:bg-ivory/10"
                      onClick={() => {
                        set("blocks", [...p.blocks, newBlock(t)]);
                        setAdding(false);
                      }}
                    >
                      <span className="block text-[14px]">{BLOCKS[t].label}</span>
                      <span className="block text-[12px] text-ash">{BLOCKS[t].hint}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        }
      >
        {p.blocks.length === 0 && <p className="text-[13px] text-ash">No blocks yet — add the first one.</p>}
        <SortableList
          items={p.blocks}
          onReorder={(b) => set("blocks", b)}
          className="space-y-2"
          itemClassName="border border-ivory/15 bg-ink"
          render={(b, handle, i) => (
            <div>
              <div className="flex items-center gap-2 border-b border-ivory/10 py-1 pr-1">
                {handle}
                <span className="t-meta-sm text-ash">{String(i + 1).padStart(2, "0")}</span>
                <span className="t-meta flex-1">{BLOCKS[b.type].label}</span>
                <Button variant="ghost" aria-label="Remove block" onClick={() => set("blocks", p.blocks.filter((x) => x.id !== b.id))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-3">
                <BlockFields b={b} media={media} byId={byId} onChange={(patch) => updateBlock(b.id, patch)} onUploaded={addMedia} />
              </div>
            </div>
          )}
        />
      </Section>

      {/* Save bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-ivory/15 bg-ink/95 px-4 py-3 backdrop-blur lg:left-[220px] lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">{msg ? <Notice kind={msg.kind}>{msg.text}</Notice> : <span className="t-meta-sm text-ash">{dirty ? "● Unsaved changes" : "All changes saved"}</span>}</div>
          <Button variant="primary" onClick={save} disabled={pending || !dirty}>
            {pending ? "Saving…" : "Save project"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BlockFields({
  b,
  media,
  byId,
  onChange,
  onUploaded,
}: {
  b: Block;
  media: MediaAsset[];
  byId: Record<string, MediaAsset>;
  onChange: (patch: Partial<Block>) => void;
  onUploaded: (a: MediaAsset) => void;
}) {
  const [picking, setPicking] = useState(false);
  if ("assetIds" in b) {
    const items = b.assetIds.map((id, i) => ({ id: `${id}::${i}`, asset: id }));
    return (
      <div className="space-y-3">
        {items.length > 0 && (
          <SortableList
            grid
            items={items}
            onReorder={(next) => onChange({ assetIds: next.map((x) => x.asset) })}
            className="flex flex-wrap gap-2"
            render={(it, handle) => (
              <div className="flex items-center border border-ivory/15">
                {handle}
                <MediaThumb asset={byId[it.asset]} media={byId} className="h-16 w-16" />
              </div>
            )}
          />
        )}
        <Button onClick={() => setPicking(true)}>{items.length ? "Edit selection" : "Choose images"}</Button>
        {b.type === "asymmetric" && b.assetIds.length > 3 && <Notice kind="info">This layout shows the first 3 images.</Notice>}
        {picking && (
          <MediaPicker
            multiple
            media={media}
            kinds={["image"]}
            initial={b.assetIds}
            onUploaded={onUploaded}
            onClose={() => setPicking(false)}
            onConfirm={(ids) => {
              onChange({ assetIds: ids });
              setPicking(false);
            }}
          />
        )}
      </div>
    );
  }
  switch (b.type) {
    case "image":
    case "video":
    case "imageText": {
      const kinds: MediaKind[] = b.type === "video" ? ["video", "embed"] : ["image"];
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <MediaField label={b.type === "video" ? "Video" : "Image"} value={b.assetId || undefined} onChange={(v) => onChange({ assetId: v ?? "" })} kinds={kinds} media={media} onUploaded={onUploaded} />
          <div className="space-y-3">
            {b.type !== "imageText" && (
              <Field label="Caption (optional)">
                <Input value={b.caption ?? ""} onChange={(e) => onChange({ caption: e.target.value || undefined })} />
              </Field>
            )}
            {b.type === "video" && <Toggle label="Autoplay silently when visible" checked={b.autoplay} onChange={(v) => onChange({ autoplay: v })} />}
            {b.type === "imageText" && (
              <>
                <Field label="Heading">
                  <Input value={b.heading ?? ""} onChange={(e) => onChange({ heading: e.target.value || undefined })} />
                </Field>
                <Field label="Text">
                  <Textarea rows={3} value={b.text} onChange={(e) => onChange({ text: e.target.value })} />
                </Field>
                <Field label="Image side">
                  <Select value={b.side} onChange={(e) => onChange({ side: e.target.value as "left" | "right" })}>
                    <option value="left">Image left</option>
                    <option value="right">Image right</option>
                  </Select>
                </Field>
              </>
            )}
          </div>
        </div>
      );
    }
    case "embed":
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="YouTube or Vimeo URL" hint={parseEmbed(b.url) ? `✓ ${parseEmbed(b.url)!.provider}` : "Not recognised yet"}>
            <Input value={b.url} onChange={(e) => onChange({ url: e.target.value })} />
          </Field>
          <Field label="Caption (optional)">
            <Input value={b.caption ?? ""} onChange={(e) => onChange({ caption: e.target.value || undefined })} />
          </Field>
        </div>
      );
    case "text":
      return (
        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <div className="space-y-3">
            <Field label="Kicker (optional)">
              <Input value={b.heading ?? ""} onChange={(e) => onChange({ heading: e.target.value || undefined })} />
            </Field>
            <Field label="Text" hint="Blank line = new paragraph">
              <Textarea rows={4} value={b.body} onChange={(e) => onChange({ body: e.target.value })} />
            </Field>
          </div>
          <Field label="Size">
            <Select value={b.size} onChange={(e) => onChange({ size: e.target.value as "lg" | "xl" })}>
              <option value="lg">Large paragraph</option>
              <option value="xl">Statement (XL)</option>
            </Select>
          </Field>
        </div>
      );
  }
}
