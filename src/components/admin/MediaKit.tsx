"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import { FileText, Film, Image as ImageIcon, Link2, Upload, X } from "lucide-react";
import type { MediaAsset, MediaKind } from "@/lib/types";
import { parseEmbed } from "@/lib/embed";
import { ACCEPT, precheck, uploadFile } from "./upload";
import { Button } from "./ui";

/* ───────────── Thumbnail ───────────── */

export function MediaThumb({ asset, media, className }: { asset?: MediaAsset; media?: Record<string, MediaAsset>; className?: string }) {
  if (!asset) return <div className={clsx("flex items-center justify-center bg-smoke text-ash", className)}><ImageIcon className="h-4 w-4" /></div>;
  const poster = asset.posterId && media?.[asset.posterId]?.src;
  const embedThumb = asset.kind === "embed" ? parseEmbed(asset.src)?.thumb : undefined;
  const src = asset.kind === "image" ? asset.src : poster || embedThumb;
  return (
    <div className={clsx("relative overflow-hidden bg-smoke", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      ) : asset.kind === "video" ? (
        <video src={asset.src} muted preload="metadata" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      {asset.kind !== "image" && (
        <span className="t-meta-sm absolute bottom-1 left-1 flex items-center gap-1 bg-ink/80 px-1 text-ivory">
          {asset.kind === "video" ? <Film className="h-3 w-3" /> : asset.kind === "embed" ? <Link2 className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
          {asset.kind === "embed" ? asset.provider : asset.kind}
        </span>
      )}
    </div>
  );
}

/* ───────────── Uploader ───────────── */

type Job = { key: string; name: string; pct: number; error?: string; done?: boolean };

export function Uploader({ onUploaded, compact }: { onUploaded: (a: MediaAsset) => void; compact?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [over, setOver] = useState(false);

  const start = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      const key = `${file.name}-${file.size}-${Math.random()}`;
      const problem = precheck(file);
      setJobs((j) => [...j, { key, name: file.name, pct: 0, error: problem ?? undefined }]);
      if (problem) continue;
      try {
        const asset = await uploadFile(file, (pct) => setJobs((j) => j.map((x) => (x.key === key ? { ...x, pct } : x))));
        setJobs((j) => j.map((x) => (x.key === key ? { ...x, pct: 100, done: true } : x)));
        onUploaded(asset);
      } catch (e) {
        setJobs((j) => j.map((x) => (x.key === key ? { ...x, error: (e as Error).message } : x)));
      }
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (e.dataTransfer.files.length) start(e.dataTransfer.files);
        }}
        className={clsx("flex flex-col items-center justify-center gap-2 border border-dashed text-center transition-colors", compact ? "p-4" : "p-8", over ? "border-orange bg-orange/10" : "border-ivory/25")}
      >
        <Upload className="h-5 w-5 text-ash" />
        <p className="text-[13px] text-ash">Drop files here or</p>
        <Button onClick={() => input.current?.click()}>Choose files</Button>
        <p className="t-meta-sm text-ash/70">JPG · PNG · WebP · AVIF ≤ 20 MB — MP4 · WebM ≤ 400 MB — PDF ≤ 15 MB</p>
        <input
          ref={input}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) start(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {jobs.length > 0 && (
        <ul className="mt-3 space-y-1.5" aria-live="polite">
          {jobs.map((j) => (
            <li key={j.key} className="text-[12px]">
              <div className="flex justify-between gap-3">
                <span className="truncate text-ivory/80">{j.name}</span>
                <span className={clsx("shrink-0", j.error ? "text-[#ff8a7a]" : j.done ? "text-mint" : "text-ash")}>
                  {j.error ? "Failed" : j.done ? "Done" : `${j.pct}%`}
                </span>
              </div>
              {j.error ? (
                <p className="text-[#ff8a7a]">{j.error}</p>
              ) : (
                <div className="mt-1 h-[3px] bg-ivory/10">
                  <div className="h-full bg-red transition-[width]" style={{ width: `${j.pct}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ───────────── Picker (modal) ───────────── */

export function MediaPicker({
  media,
  kinds,
  multiple,
  initial = [],
  onClose,
  onConfirm,
  onUploaded,
  title = "Select media",
}: {
  media: MediaAsset[];
  kinds: MediaKind[];
  multiple?: boolean;
  initial?: string[];
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
  onUploaded: (a: MediaAsset) => void;
  title?: string;
}) {
  const [sel, setSel] = useState<string[]>(initial);
  const list = media.filter((m) => kinds.includes(m.kind));
  const byId = Object.fromEntries(media.map((m) => [m.id, m]));
  const toggle = (id: string) => {
    if (!multiple) return setSel([id]);
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3" onClick={onClose}>
      <div className="flex max-h-[92svh] w-full max-w-5xl flex-col border border-ivory/20 bg-ink" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-ivory/15 px-4 py-3">
          <h2 className="t-meta">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center text-ash hover:text-ivory">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="grid flex-1 gap-4 overflow-y-auto p-4 md:grid-cols-[1fr_260px]">
          <div>
            {list.length === 0 && <p className="text-[13px] text-ash">Nothing here yet — upload on the right.</p>}
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
              {list.map((m) => {
                const n = sel.indexOf(m.id);
                return (
                  <li key={m.id}>
                    <button type="button" onClick={() => toggle(m.id)} className={clsx("relative block w-full outline outline-2 outline-offset-0", n >= 0 ? "outline-red" : "outline-transparent")} aria-pressed={n >= 0} title={m.alt}>
                      <MediaThumb asset={m} media={byId} className="aspect-square" />
                      {n >= 0 && <span className="t-meta-sm absolute right-1 top-1 bg-red px-1.5 text-ivory">{multiple ? n + 1 : "✓"}</span>}
                    </button>
                    <p className="mt-1 truncate text-[11px] text-ash">{m.alt || m.id}</p>
                  </li>
                );
              })}
            </ul>
          </div>
          <Uploader
            compact
            onUploaded={(a) => {
              onUploaded(a);
              if (kinds.includes(a.kind)) setSel((s) => (multiple ? [...s, a.id] : [a.id]));
            }}
          />
        </div>
        <footer className="flex items-center justify-between gap-3 border-t border-ivory/15 px-4 py-3">
          <span className="t-meta-sm text-ash">{multiple ? `${sel.length} selected — order follows click order` : sel.length ? "1 selected" : "None selected"}</span>
          <div className="flex gap-2">
            {!multiple && sel.length > 0 && (
              <Button variant="ghost" onClick={() => onConfirm([])}>
                Clear
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => onConfirm(sel)}>
              Use selection
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}

/** Single-asset field with thumbnail + picker. */
export function MediaField({
  label,
  value,
  onChange,
  kinds,
  media,
  onUploaded,
  ratio = "aspect-video",
}: {
  label: string;
  value?: string;
  onChange: (id?: string) => void;
  kinds: MediaKind[];
  media: MediaAsset[];
  onUploaded: (a: MediaAsset) => void;
  ratio?: string;
}) {
  const [open, setOpen] = useState(false);
  const byId = Object.fromEntries(media.map((m) => [m.id, m]));
  const asset = value ? byId[value] : undefined;
  return (
    <div>
      <span className="t-meta-sm mb-1.5 block text-ash">{label}</span>
      <div className="flex items-start gap-3">
        <button type="button" onClick={() => setOpen(true)} className={clsx("w-32 shrink-0 border border-ivory/20 hover:border-orange", ratio)} aria-label={`Choose ${label}`}>
          <MediaThumb asset={asset} media={byId} className="h-full w-full" />
        </button>
        <div className="min-w-0 space-y-2">
          <p className="truncate text-[13px] text-ivory/80">{asset ? asset.alt || asset.id : "Not set"}</p>
          <div className="flex gap-2">
            <Button onClick={() => setOpen(true)}>{asset ? "Change" : "Choose"}</Button>
            {asset && (
              <Button variant="ghost" onClick={() => onChange(undefined)}>
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
      {open && (
        <MediaPicker
          title={label}
          media={media}
          kinds={kinds}
          initial={value ? [value] : []}
          onClose={() => setOpen(false)}
          onUploaded={onUploaded}
          onConfirm={(ids) => {
            onChange(ids[0]);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
