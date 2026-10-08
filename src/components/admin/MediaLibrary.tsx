"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { MediaAsset, MediaKind } from "@/lib/types";
import { addRemoteVideo, deleteMedia, updateMedia } from "@/app/admin/actions";
import { Button, Field, Input, Notice, Section, Select } from "./ui";
import { MediaThumb, Uploader } from "./MediaKit";

const FILTERS: { id: "all" | MediaKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "image", label: "Images" },
  { id: "video", label: "Videos" },
  { id: "embed", label: "Links" },
  { id: "file", label: "Files" },
];

const size = (b?: number) => (b ? (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`) : "");

function Card({ m, byId, images, refs, onDone }: { m: MediaAsset; byId: Record<string, MediaAsset>; images: MediaAsset[]; refs: string[]; onDone: (r: { ok: boolean; text: string }) => void }) {
  const [alt, setAlt] = useState(m.alt);
  const [caption, setCaption] = useState(m.caption ?? "");
  const [poster, setPoster] = useState(m.posterId ?? "");
  const [pending, start] = useTransition();
  const dirty = alt !== m.alt || caption !== (m.caption ?? "") || poster !== (m.posterId ?? "");
  const canPoster = m.kind === "video" || m.kind === "embed";

  return (
    <li className="flex flex-col border border-ivory/15 bg-[#121110]">
      <a href={m.src} target="_blank" rel="noreferrer" className="block" title="Open original">
        <MediaThumb asset={m} media={byId} className="aspect-[4/3]" />
      </a>
      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <p className="t-meta-sm flex justify-between gap-2 text-ash">
          <span className="truncate">{m.origin === "placeholder" ? "placeholder" : m.kind}</span>
          <span>{[m.width && m.height ? `${m.width}×${m.height}` : "", size(m.size)].filter(Boolean).join(" · ")}</span>
        </p>
        <Field label="Alt text">
          <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe what's in the frame" className={clsx(!alt && m.kind === "image" && "border-orange/60")} />
        </Field>
        <Field label="Caption">
          <Input value={caption} onChange={(e) => setCaption(e.target.value)} />
        </Field>
        {canPoster && (
          <Field label="Poster frame">
            <Select value={poster} onChange={(e) => setPoster(e.target.value)}>
              <option value="">{m.kind === "embed" ? "Provider thumbnail" : "None (first frame)"}</option>
              {images.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.alt || i.id}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <p className="text-[11px] leading-snug text-ash" title={refs.join("\n")}>
          {refs.length ? `Used in ${refs.length} place${refs.length > 1 ? "s" : ""}: ${refs.slice(0, 2).join("; ")}${refs.length > 2 ? "…" : ""}` : "Not used anywhere"}
        </p>
        <div className="mt-auto flex gap-2 pt-1">
          <Button
            variant="primary"
            className="flex-1"
            disabled={!dirty || pending}
            onClick={() =>
              start(async () => {
                const r = await updateMedia(m.id, { alt, caption: caption || undefined, posterId: poster || undefined });
                onDone({ ok: r.ok, text: r.ok ? "Saved" : r.error });
              })
            }
          >
            Save
          </Button>
          <Button
            variant="danger"
            disabled={pending || refs.length > 0 || m.origin === "placeholder"}
            title={refs.length ? "Remove it from the places listed before deleting" : m.origin === "placeholder" ? "Built-in placeholder" : "Delete permanently"}
            onClick={() => {
              if (!confirm("Delete this file permanently?")) return;
              start(async () => {
                const r = await deleteMedia(m.id);
                onDone({ ok: r.ok, text: r.ok ? "Deleted" : r.error });
              });
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </li>
  );
}

export function MediaLibrary({ media, refs }: { media: MediaAsset[]; refs: Record<string, string[]> }) {
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [unused, setUnused] = useState(false);
  const [url, setUrl] = useState("");
  const [urlAlt, setUrlAlt] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const byId = useMemo(() => Object.fromEntries(media.map((m) => [m.id, m])), [media]);
  const images = media.filter((m) => m.kind === "image");
  const list = media.filter((m) => (filter === "all" || m.kind === filter) && (!unused || !(refs[m.id]?.length)));

  const done = (r: { ok: boolean; text: string }) => {
    setMsg(r);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="t-meta text-ash">Library</p>
        <h1 className="t-display text-[56px] md:text-[80px]">Media</h1>
      </header>
      {msg && <Notice kind={msg.ok ? "ok" : "error"}>{msg.text}</Notice>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Upload" hint="Uploads are stored on this server. Dimensions are read automatically.">
          <Uploader onUploaded={() => router.refresh()} />
        </Section>
        <Section title="Add a video link" hint="YouTube or Vimeo — nothing loads for visitors until they press play.">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                const r = await addRemoteVideo(url, urlAlt);
                done({ ok: r.ok, text: r.ok ? "Video link added" : r.error });
                if (r.ok) {
                  setUrl("");
                  setUrlAlt("");
                }
              });
            }}
          >
            <Field label="URL">
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://vimeo.com/123456789" required />
            </Field>
            <Field label="Description">
              <Input value={urlAlt} onChange={(e) => setUrlAlt(e.target.value)} placeholder="Campaign film, 60s" />
            </Field>
            <Button type="submit" variant="primary" disabled={pending}>
              Add link
            </Button>
          </form>
        </Section>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} className={clsx("t-meta h-9 px-3", filter === f.id ? "bg-ivory text-ink" : "text-ash hover:text-ivory")}>
            {f.label}
          </button>
        ))}
        <label className="t-meta ml-auto flex items-center gap-2 text-ash">
          <input type="checkbox" checked={unused} onChange={(e) => setUnused(e.target.checked)} className="accent-red" /> Unused only
        </label>
      </div>

      {list.length === 0 ? (
        <p className="text-[13px] text-ash">Nothing to show.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {list.map((m) => (
            <Card key={`${m.id}-${m.alt}-${m.caption}-${m.posterId}`} m={m} byId={byId} images={images} refs={refs[m.id] ?? []} onDone={done} />
          ))}
        </ul>
      )}
    </div>
  );
}
