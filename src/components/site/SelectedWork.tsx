"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import clsx from "clsx";
import type { MediaAsset, ResolvedProject, Settings } from "@/lib/types";
import { Media } from "../media/Media";
import { AmbientVideo } from "../media/Video";
import { ClipReveal, EASE, MaskLines, Reveal } from "./Motion";

type P = { p: ResolvedProject; media: Record<string, MediaAsset>; i: number };

const metaLine = (p: ResolvedProject) =>
  [p.categories[0]?.filterLabel ?? p.disciplines[0], p.disciplines[1], String(p.year)].filter(Boolean).join(" / ");

/** Text color that reads on the project's accent. */
export function onAccent(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#0B0B0B" : "#F4E9D6";
}

function Cover({ p, media, hover, sizes, mode = "hover", priority }: P & { hover: boolean; sizes: string; mode?: "hover" | "visible"; priority?: boolean }) {
  const poster = p.coverVideo?.posterId ? media[p.coverVideo.posterId]?.src : p.cover?.src;
  return (
    <>
      <motion.div className="absolute inset-0" animate={{ scale: hover ? 1.04 : 1 }} transition={{ duration: 1.2, ease: EASE }}>
        <Media asset={p.cover} sizes={sizes} priority={priority} emptyLabel="Cover image" />
        {p.coverVideo?.kind === "video" && <AmbientVideo src={p.coverVideo.src} poster={poster} active={hover} mode={mode} />}
      </motion.div>
    </>
  );
}

function ViewButton({ hover, color }: { hover: boolean; color?: string }) {
  return (
    <span className="t-meta inline-flex items-center gap-3" style={{ color }}>
      <span className="relative overflow-hidden">
        <span className={clsx("block transition-transform duration-500", hover && "lg:-translate-y-full")}>View project ↗</span>
        <span aria-hidden className={clsx("absolute inset-0 hidden translate-y-full transition-transform duration-500 lg:block", hover && "lg:translate-y-0")}>
          View case study ↗
        </span>
      </span>
    </span>
  );
}

function FullBleed({ p, media, i }: P) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      href={`/work/${p.slug}`}
      className="group relative block"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <ClipReveal className="relative aspect-[4/5] overflow-hidden sm:aspect-[16/10] lg:aspect-[21/9]">
        <Cover p={p} media={media} i={i} hover={hover} sizes="100vw" mode="visible" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(11,11,11,.85),transparent_55%)]" />
        <span className="t-display outline-type absolute left-[var(--gutter)] top-4 text-[clamp(72px,14vw,220px)] text-ivory/70">{p.number}</span>
        <div className="t-meta absolute right-[var(--gutter)] top-5 text-right">
          Project {p.number}
          <br />
          {p.client || p.title}
        </div>
        <div className="gutter absolute inset-x-0 bottom-0 pb-5 md:pb-8">
          <h3 className="t-display text-[clamp(64px,15vw,260px)] text-ivory" style={{ letterSpacing: hover ? "0.005em" : "-0.012em", transition: "letter-spacing .8s cubic-bezier(.2,.7,.15,1)" }}>
            {p.title}
          </h3>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-ivory/30 pt-3">
            <p className="t-heavy text-[clamp(18px,2.4vw,34px)]" style={{ color: p.accent }}>
              {p.subtitle}
            </p>
            <p className="t-meta">{metaLine(p)}</p>
            <ViewButton hover={hover} />
          </div>
        </div>
      </ClipReveal>
    </Link>
  );
}

function Split({ p, media, i }: P) {
  const [hover, setHover] = useState(false);
  const flip = i % 2 === 1;
  const fg = onAccent(p.accent);
  return (
    <Link
      href={`/work/${p.slug}`}
      className="group grid grid-cols-1 lg:grid-cols-12"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <ClipReveal from={flip ? "right" : "left"} className={clsx("relative aspect-[4/5] overflow-hidden lg:col-span-7 lg:aspect-auto lg:min-h-[86svh]", flip && "lg:order-2")}>
        <Cover p={p} media={media} i={i} hover={hover} sizes="(min-width:1024px) 58vw, 100vw" />
      </ClipReveal>
      <div className="relative flex flex-col justify-between gap-10 p-[var(--gutter)] py-8 lg:col-span-5 lg:py-10" style={{ background: p.accent, color: fg }}>
        <div className="flex items-start justify-between">
          <span className="t-meta">Project {p.number}</span>
          <span className="t-meta text-right">{p.client}</span>
        </div>
        <div>
          <span className="t-display block text-[clamp(110px,18vw,300px)] leading-[0.75] opacity-90">{p.number.slice(1)}</span>
          <h3 className="t-display mt-6 text-[clamp(56px,7.5vw,140px)]">
            <MaskLines lines={p.title.split(" ")} />
          </h3>
          <p className="t-heavy mt-3 text-[clamp(18px,2vw,30px)]">{p.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3 border-t pt-3" style={{ borderColor: `${fg}55` }}>
          <p className="t-meta">{metaLine(p)}</p>
          <ViewButton hover={hover} />
        </div>
      </div>
    </Link>
  );
}

function Poster({ p, media, i }: P) {
  const [hover, setHover] = useState(false);
  const fg = onAccent(p.accent);
  const words = p.title.toUpperCase().split(" ");
  const top = words.length > 1 ? words.slice(0, Math.ceil(words.length / 2)).join(" ") : p.title;
  const bottom = words.length > 1 ? words.slice(Math.ceil(words.length / 2)).join(" ") : p.subtitle;
  return (
    <Link
      href={`/work/${p.slug}`}
      className="group relative block overflow-hidden px-[var(--gutter)] py-10 md:py-14"
      style={{ background: p.accent, color: fg }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="t-meta flex justify-between">
        <span>
          Project {p.number}
          <br />
          {p.client}
        </span>
        <span className="text-right">
          {p.year}
          <br />
          {p.categories.map((c) => c.filterLabel).join(" · ")}
        </span>
      </div>
      <div className="relative mx-auto mt-4 max-w-[1100px]">
        <h3 className="t-display relative z-10 text-center text-[clamp(64px,13vw,220px)]">{top}</h3>
        <div className="relative mx-auto -mt-[0.6em] w-[78%] md:w-[56%]">
          <ClipReveal className="relative aspect-square overflow-hidden">
            <Cover p={p} media={media} i={i} hover={hover} sizes="(min-width:768px) 56vw, 78vw" />
          </ClipReveal>
          <span className="t-meta vertical absolute -left-8 top-0 hidden md:block">{p.disciplines.join(" / ")}</span>
          <span className="t-meta vertical absolute -right-8 bottom-0 hidden rotate-0 md:block" style={{ transform: "none" }}>
            {p.role}
          </span>
        </div>
        <p className="t-display relative z-10 -mt-[0.35em] text-center text-[clamp(40px,7vw,120px)]">{bottom}</p>
      </div>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-t pt-3" style={{ borderColor: `${fg}55` }}>
        <span className="t-meta">{metaLine(p)}</span>
        <ViewButton hover={hover} />
      </div>
    </Link>
  );
}

function Sequence({ p, media, i }: P) {
  const [hover, setHover] = useState(false);
  const positions = ["0% 50%", "50% 50%", "100% 50%"];
  return (
    <Link
      href={`/work/${p.slug}`}
      className="group block bg-ink px-[var(--gutter)] py-10 md:py-16"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <h3 className="t-display text-[clamp(56px,13vw,220px)]" style={{ color: p.accent }}>
          <MaskLines lines={[p.title]} />
        </h3>
        <span className="t-meta mb-3 sm:text-right">
          Project {p.number}
          <br />
          {metaLine(p)}
        </span>
      </div>
      {/* film strip */}
      <div className="relative mt-4 bg-[#141312] px-2 py-5 md:px-4 md:py-7">
        <div aria-hidden className="absolute inset-x-0 top-1.5 h-2 bg-[repeating-linear-gradient(90deg,#2a2826_0_14px,transparent_14px_26px)] md:top-2" />
        <div aria-hidden className="absolute inset-x-0 bottom-1.5 h-2 bg-[repeating-linear-gradient(90deg,#2a2826_0_14px,transparent_14px_26px)] md:bottom-2" />
        <div className="grid grid-cols-3 gap-1.5 md:gap-3">
          {positions.map((pos, k) => (
            <motion.div
              key={k}
              className="relative aspect-[3/4] overflow-hidden md:aspect-[4/3]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: EASE, delay: k * 0.12 }}
            >
              {k === 1 && p.coverVideo?.kind === "video" ? (
                <Cover p={p} media={media} i={i} hover={hover} sizes="33vw" mode="visible" />
              ) : (
                <motion.div className="absolute inset-0" animate={{ scale: hover ? 1.06 : 1 }} transition={{ duration: 1.2, ease: EASE }}>
                  <Media asset={p.cover} sizes="33vw" position={pos} />
                </motion.div>
              )}
              <span className="t-meta-sm absolute bottom-2 left-2 text-ivory/80">
                {p.number}—{String(k + 1).padStart(2, "0")}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <p className="t-heavy text-[clamp(18px,2vw,30px)]">{p.subtitle}</p>
        <ViewButton hover={hover} />
      </div>
    </Link>
  );
}

export function SelectedWork({ s, projects, media }: { s: Settings; projects: ResolvedProject[]; media: Record<string, MediaAsset> }) {
  return (
    <section id="work" aria-labelledby="work-title" className="bg-ink">
      <header className="relative bg-red px-[var(--gutter)] pb-6 pt-[calc(var(--nav-h)+24px)] text-ink md:pb-8">
        <div className="t-meta flex justify-between">
          <span>Scene 02 / Selected Work</span>
          <span>{String(projects.length).padStart(2, "0")} features</span>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:items-end">
          <h2 id="work-title" className="t-display text-[clamp(84px,19vw,340px)] lg:col-span-9">
            <MaskLines lines={s.selectedWork.headline} />
          </h2>
          <Reveal className="lg:col-span-3 lg:pb-[2vw]">
            <p className="max-w-[30ch] text-[17px] leading-snug lg:text-[19px]">{s.selectedWork.subtitle}</p>
          </Reveal>
        </div>
      </header>

      {projects.length === 0 ? (
        <p className="t-meta gutter py-24 text-center text-ash">No featured projects yet — mark projects as featured in /admin.</p>
      ) : (
        <ol className="flex flex-col gap-[var(--gutter)] py-[var(--gutter)]">
          {projects.map((p, i) => {
            const L = { fullbleed: FullBleed, split: Split, poster: Poster, sequence: Sequence }[p.featuredLayout];
            return (
              <li key={p.id}>
                <L p={p} media={media} i={i} />
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
