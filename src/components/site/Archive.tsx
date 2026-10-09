"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import type { Category, ResolvedProject, Settings } from "@/lib/types";
import { focusPosition, Media } from "../media/Media";
import { EASE, MaskLines, Reveal } from "./Motion";
import { onAccent } from "./SelectedWork";

type Sort = "index" | "newest" | "oldest" | "az";
const SORTS: { id: Sort; label: string }[] = [
  { id: "index", label: "Index" },
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "az", label: "A–Z" },
];

const SHAPE = {
  poster: { span: "md:col-span-3 lg:col-span-4", ratio: "aspect-[4/5]" },
  landscape: { span: "md:col-span-6 lg:col-span-8", ratio: "aspect-[4/5] md:aspect-[16/10]" },
  square: { span: "md:col-span-3 lg:col-span-4", ratio: "aspect-square" },
  type: { span: "md:col-span-3 lg:col-span-4", ratio: "aspect-[4/5]" },
} as const;

function Card({ p }: { p: ResolvedProject }) {
  const shape = SHAPE[p.archiveShape];
  const cats = p.categories.map((c) => c.filterLabel).join(" · ");
  if (p.archiveShape === "type") {
    const fg = onAccent(p.accent);
    return (
      <Link href={`/work/${p.slug}`} className={clsx("group relative flex flex-col justify-between overflow-hidden p-4 md:p-5", shape.ratio)} style={{ background: p.accent, color: fg }}>
        <div className="t-meta flex justify-between">
          <span>№ {p.number}</span>
          <span>{p.year}</span>
        </div>
        <h3 className="t-display break-words text-[clamp(54px,7.6vw,128px)] transition-transform duration-700 group-hover:-translate-y-2">{p.title}</h3>
        <div className="t-meta border-t pt-2" style={{ borderColor: `${fg}55` }}>
          <p>{p.subtitle}</p>
          <p className="opacity-70">{cats}</p>
        </div>
      </Link>
    );
  }
  return (
    <Link href={`/work/${p.slug}`} className="group block">
      <div className={clsx("relative overflow-hidden", shape.ratio)}>
        <div className="absolute inset-0 transition-transform duration-[1200ms] ease-[cubic-bezier(.2,.7,.15,1)] group-hover:scale-[1.045]">
          <Media asset={p.cover} sizes="(min-width:1024px) 66vw, (min-width:768px) 50vw, 100vw" emptyLabel="Cover" position={focusPosition(p.coverFocus)} />
        </div>
        <span className="t-meta absolute left-3 top-3 bg-ink px-1.5 py-0.5 text-ivory">№ {p.number}</span>
        <span className="t-meta absolute right-3 top-3 translate-y-1 bg-ivory px-1.5 py-0.5 text-ink opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          View ↗
        </span>
      </div>
      <div className="mt-3.5 grid grid-cols-[1fr_auto] items-end gap-x-4 border-t border-ink/25 pt-2.5">
        <h3 className="t-display text-[clamp(29px,3.4vw,54px)] leading-[0.95]">{p.title}</h3>
        <span className="t-meta text-right">{p.year}</span>
        <p className="t-meta col-span-2 mt-2 text-ink/60">{[p.client, cats].filter(Boolean).join(" — ")}</p>
      </div>
    </Link>
  );
}

export function Archive({ s, categories, projects }: { s: Settings; categories: Category[]; projects: ResolvedProject[] }) {
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("index");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: projects.length };
    for (const cat of categories) c[cat.id] = projects.filter((p) => p.categoryIds.includes(cat.id)).length;
    return c;
  }, [projects, categories]);

  const visible = useMemo(() => {
    const list = filter === "all" ? projects : projects.filter((p) => p.categoryIds.includes(filter));
    const sorted = [...list];
    if (sort === "newest") sorted.sort((a, b) => b.year - a.year || a.order - b.order);
    if (sort === "oldest") sorted.sort((a, b) => a.year - b.year || a.order - b.order);
    if (sort === "az") sorted.sort((a, b) => a.title.localeCompare(b.title));
    return sorted;
  }, [projects, filter, sort]);

  const filters = [{ id: "all", label: "All" }, ...categories.map((c) => ({ id: c.id, label: c.filterLabel }))];
  const activeCat = categories.find((c) => c.id === filter);

  return (
    <section id="archive" aria-labelledby="archive-title" className="bg-ivory text-ink">
      <div className="gutter pb-20 pt-[calc(var(--nav-h)+28px)] md:pb-28">
        <div className="t-meta flex justify-between">
          <span>Scene 03 / The Archive</span>
          <span>{String(projects.length).padStart(2, "0")} titles</span>
        </div>

        <div className="mt-7 grid gap-9 lg:grid-cols-12">
          <h2 id="archive-title" className="t-display text-[clamp(71px,14.5vw,255px)] lg:col-span-7">
            <MaskLines lines={s.archive.headline} accentIndex={1} accentClassName="text-red" />
          </h2>
          <div className="flex flex-col justify-end lg:col-span-5">
            <Reveal>
              <p className="t-heavy text-[clamp(19px,2vw,32px)]">{s.archive.subtitle}</p>
            </Reveal>
          </div>
        </div>

        {/* Festival program — the disciplines */}
        <div role="list" className={clsx("mt-14 grid grid-cols-1 border-t border-ink sm:grid-cols-2", categories.length >= 5 ? "lg:grid-cols-5" : "lg:grid-cols-4")}>
          {categories.map((c, i) => (
            <Reveal key={c.id} role="listitem" delay={i * 0.06} className="border-b border-ink/25 py-5 sm:pr-5 lg:border-b-0 lg:border-r lg:px-4 lg:first:pl-0 lg:last:border-r-0">
              <span className="t-display block text-[48px] text-red">{c.index}</span>
              <h3 className="t-heavy mt-2 text-[16px]">{c.title}</h3>
              <p className="mt-2.5 text-[14px] leading-snug text-ink/70">{c.description}</p>
            </Reveal>
          ))}
        </div>

        {/* Controls — scroll away with the section (not sticky) */}
        <div className="-mx-[var(--gutter)] mt-14 flex flex-wrap items-center justify-between gap-3 border-y border-ink px-[var(--gutter)] py-2">
          <div role="group" aria-label="Filter by discipline" className="-mx-1 flex max-w-full gap-1 overflow-x-auto pb-0.5">
            {filters.map((f) => {
              const on = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setFilter(f.id)}
                  className={clsx("t-meta flex h-10 shrink-0 items-center gap-1.5 px-3 transition-colors", on ? "bg-ink text-ivory" : "hover:bg-ink/10")}
                >
                  {f.label}
                  <sup className="text-[9px] opacity-60">{counts[f.id] ?? 0}</sup>
                </button>
              );
            })}
          </div>
          <label className="t-meta flex items-center gap-2">
            Sort
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="t-meta h-10 cursor-pointer border border-ink/30 bg-transparent px-2">
              {SORTS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="t-meta mt-5 text-ink/60" aria-live="polite">
          {activeCat ? `${activeCat.index} — ${activeCat.title}` : "All disciplines"} · {visible.length} {visible.length === 1 ? "title" : "titles"}
        </p>

        <motion.ul layout className="mt-7 grid grid-flow-row-dense grid-cols-1 gap-x-[var(--gutter)] gap-y-14 md:grid-cols-6 lg:grid-cols-12">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((p) => (
              <motion.li
                layout
                key={p.id}
                className={SHAPE[p.archiveShape].span}
                initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
                animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.55, ease: EASE }}
              >
                <Card p={p} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>

        {visible.length === 0 && (
          <div className="mt-7 flex flex-col items-start gap-5 border border-dashed border-ink/40 p-9 md:p-14">
            <span className="t-display text-[clamp(41px,6vw,94px)] text-ink/20">Coming soon.</span>
            <p className="t-meta">No titles in this programme yet.</p>
            <button type="button" className="t-meta link-wipe" onClick={() => setFilter("all")}>
              ← Back to all disciplines
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
