"use client";

import { useState } from "react";
import clsx from "clsx";
import type { Block, MediaAsset } from "@/lib/types";
import { aspectOf, Media } from "../media/Media";
import { EmbedPlayer, VideoPlayer } from "../media/Video";
import { Lightbox } from "../media/Lightbox";
import { ClipReveal, Reveal } from "./Motion";

type Ctx = { media: Record<string, MediaAsset>; open: (id: string) => void };

/** Clickable media frame — opens the lightbox. Videos/embeds render their player. */
function Frame({ id, ctx, sizes, ratio, className, autoplay }: { id: string; ctx: Ctx; sizes: string; ratio?: string; className?: string; autoplay?: boolean }) {
  const a = ctx.media[id];
  if (!a) return <div className={clsx("relative bg-smoke", ratio ?? "aspect-video", className)}><Media sizes={sizes} emptyLabel="Missing media" /></div>;
  if (a.kind === "video") {
    const poster = a.posterId ? ctx.media[a.posterId]?.src : undefined;
    return (
      <div className={className}>
        <VideoPlayer src={a.src} poster={poster} label={a.alt || "Video"} autoplay={autoplay} aspect={aspectOf(a)} />
      </div>
    );
  }
  if (a.kind === "embed") {
    const poster = a.posterId ? ctx.media[a.posterId]?.src : undefined;
    return <EmbedPlayer url={a.src} label={a.alt || "Video"} posterSrc={poster} className={className} />;
  }
  return (
    <button
      type="button"
      onClick={() => ctx.open(id)}
      className={clsx("group relative block w-full cursor-zoom-in overflow-hidden", className)}
      style={ratio ? undefined : { aspectRatio: String(aspectOf(a, 3 / 2)) }}
      aria-label={`Open image: ${a.alt || "image"}`}
    >
      <div className={clsx(ratio, "relative h-full w-full")}>
        <div className="absolute inset-0 transition-transform duration-[1200ms] ease-[cubic-bezier(.2,.7,.15,1)] group-hover:scale-[1.03]">
          <Media asset={a} sizes={sizes} />
        </div>
      </div>
    </button>
  );
}

function Caption({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="t-meta mt-2 text-ivory/60">{children}</p>;
}

function Paragraphs({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {text
        .split(/\n{2,}/)
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className={className}>
            {p}
          </p>
        ))}
    </>
  );
}

function BlockView({ b, ctx }: { b: Block; ctx: Ctx }) {
  switch (b.type) {
    case "image":
      return (
        <ClipReveal>
          <Frame id={b.assetId} ctx={ctx} sizes="100vw" />
          <Caption>{b.caption}</Caption>
        </ClipReveal>
      );
    case "video":
      return (
        <Reveal>
          <Frame id={b.assetId} ctx={ctx} sizes="100vw" autoplay={b.autoplay} />
          <Caption>{b.caption ?? ctx.media[b.assetId]?.caption}</Caption>
        </Reveal>
      );
    case "embed":
      return (
        <Reveal>
          <EmbedPlayer url={b.url} label={b.caption || "Video"} />
          <Caption>{b.caption}</Caption>
        </Reveal>
      );
    case "grid2":
    case "grid3":
      return (
        <div className={clsx("grid grid-cols-1 items-start gap-[calc(var(--gutter)/2)]", b.type === "grid2" ? "md:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3")}>
          {b.assetIds.map((id, i) => (
            <Reveal key={id + i} delay={i * 0.08}>
              <Frame id={id} ctx={ctx} sizes={b.type === "grid2" ? "(min-width:768px) 50vw, 100vw" : "(min-width:1024px) 33vw, 50vw"} />
            </Reveal>
          ))}
        </div>
      );
    case "asymmetric": {
      const [a, b2, c] = b.assetIds;
      return (
        <div className="grid grid-cols-12 gap-[calc(var(--gutter)/2)]">
          {a && (
            <Reveal className="col-span-12 md:col-span-5 md:row-span-2">
              <Frame id={a} ctx={ctx} sizes="(min-width:768px) 42vw, 100vw" ratio="aspect-[4/5]" />
            </Reveal>
          )}
          {b2 && (
            <Reveal delay={0.08} className="col-span-12 md:col-span-7 md:mt-[12vw]">
              <Frame id={b2} ctx={ctx} sizes="(min-width:768px) 58vw, 100vw" ratio="aspect-[3/2]" />
            </Reveal>
          )}
          {c && (
            <Reveal delay={0.16} className="col-span-8 col-start-5 md:col-span-4 md:col-start-9">
              <Frame id={c} ctx={ctx} sizes="(min-width:768px) 33vw, 66vw" ratio="aspect-square" />
            </Reveal>
          )}
        </div>
      );
    }
    case "imageText":
      return (
        <div className="grid items-center gap-9 md:grid-cols-12">
          <ClipReveal from={b.side === "left" ? "left" : "right"} className={clsx("md:col-span-7", b.side === "right" && "md:order-2")}>
            <Frame id={b.assetId} ctx={ctx} sizes="(min-width:768px) 58vw, 100vw" />
          </ClipReveal>
          <Reveal className="md:col-span-5">
            {b.heading && <h3 className="t-display text-[clamp(34px,4.3vw,75px)] text-[var(--accent)]">{b.heading}</h3>}
            <div className="mt-5 space-y-5 text-[17px] leading-relaxed text-ivory/85">
              <Paragraphs text={b.text} />
            </div>
          </Reveal>
        </div>
      );
    case "filmstrip":
      return (
        <div className="-mx-[var(--gutter)] bg-[#141312] py-6">
          <div aria-hidden className="mb-3 h-2 bg-[repeating-linear-gradient(90deg,#2a2826_0_14px,transparent_14px_26px)]" />
          <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-[var(--gutter)] pb-2 [scrollbar-width:thin]" aria-label="Film strip — scroll horizontally">
            {b.assetIds.map((id, i) => (
              <li key={id + i} className="w-[78vw] shrink-0 snap-start sm:w-[48vw] lg:w-[34vw]">
                <Frame id={id} ctx={ctx} sizes="(min-width:1024px) 34vw, 78vw" ratio="aspect-[3/2]" />
                <span className="t-meta-sm mt-1.5 block text-ivory/50">Frame {String(i + 1).padStart(3, "0")}</span>
              </li>
            ))}
          </ul>
          <div aria-hidden className="mt-3 h-2 bg-[repeating-linear-gradient(90deg,#2a2826_0_14px,transparent_14px_26px)]" />
        </div>
      );
    case "gallery":
      return (
        <div>
          <ul className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {b.assetIds.map((id, i) => (
              <li key={id + i}>
                <Frame id={id} ctx={ctx} sizes="(min-width:768px) 25vw, 50vw" ratio="aspect-square" />
              </li>
            ))}
          </ul>
          <p className="t-meta mt-2 text-ivory/50">{b.assetIds.length} frames — tap to view</p>
        </div>
      );
    case "text":
      return (
        <Reveal className="mx-auto max-w-[1200px]">
          {b.heading && <p className="t-meta mb-5 text-[var(--accent)]">{b.heading}</p>}
          <div className={clsx(b.size === "xl" ? "t-heavy text-[clamp(24px,3.4vw,54px)]" : "text-[clamp(19px,1.8vw,26px)] leading-snug", "space-y-7")}>
            <Paragraphs text={b.body} />
          </div>
        </Reveal>
      );
  }
}

export function CaseBlocks({ blocks, media }: { blocks: Block[]; media: Record<string, MediaAsset> }) {
  // Every image across all blocks is part of one lightbox sequence.
  const images = blocks
    .flatMap((b) => ("assetIds" in b ? b.assetIds : "assetId" in b ? [b.assetId] : []))
    .filter((id, i, arr) => media[id]?.kind === "image" && arr.indexOf(id) === i)
    .map((id) => media[id]);
  const [index, setIndex] = useState<number | null>(null);
  const ctx: Ctx = { media, open: (id) => setIndex(images.findIndex((m) => m.id === id)) };

  return (
    <>
      <div className="flex flex-col gap-[calc(var(--gutter)*2.9)]">
        {blocks.map((b) => (
          <BlockView key={b.id} b={b} ctx={ctx} />
        ))}
      </div>
      <Lightbox items={images} index={index} onIndex={setIndex} posters={media} />
    </>
  );
}
