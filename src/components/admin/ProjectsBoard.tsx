"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import type { MediaAsset, Project } from "@/lib/types";
import { deleteProject, reorderFeatured, reorderProjects, setProjectFlag, type ActionResult } from "@/app/admin/actions";
import { SortableList } from "./Sortable";
import { MediaThumb } from "./MediaKit";
import { Button, Notice, Section, Toggle } from "./ui";

type Row = Pick<Project, "id" | "slug" | "title" | "subtitle" | "year" | "published" | "featured" | "featuredLayout" | "demo" | "coverId">;

export function ProjectsBoard({ projects, featuredOrder, media, createAction }: { projects: Row[]; featuredOrder: string[]; media: Record<string, MediaAsset>; createAction: () => Promise<void> }) {
  const router = useRouter();
  const [rows, setRows] = useState(projects);
  const [featured, setFeatured] = useState(() => {
    const f = projects.filter((p) => p.featured);
    return [...featuredOrder.map((id) => f.find((p) => p.id === id)).filter((p): p is Row => !!p), ...f.filter((p) => !featuredOrder.includes(p.id))];
  });
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<ActionResult>, okText?: string) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? (okText ? { kind: "ok", text: okText } : null) : { kind: "error", text: r.error });
      router.refresh();
    });

  const flag = (id: string, f: "published" | "featured", v: boolean) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [f]: v } : r)));
    if (f === "featured") {
      const row = rows.find((r) => r.id === id)!;
      setFeatured((fs) => (v ? [...fs, { ...row, featured: true }] : fs.filter((x) => x.id !== id)));
    }
    run(() => setProjectFlag(id, f, v));
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="t-meta text-ash">Scene index</p>
          <h1 className="t-display text-[56px] md:text-[80px]">Projects</h1>
        </div>
        <form action={createAction}>
          <Button type="submit" variant="primary">
            + New project
          </Button>
        </form>
      </header>

      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Section title="All projects" hint="Drag to set the order used in the Archive and for project numbers. Unpublished projects are invisible to visitors.">
          {rows.length === 0 ? (
            <p className="text-[13px] text-ash">No projects yet.</p>
          ) : (
            <SortableList
              items={rows}
              onReorder={(next) => {
                setRows(next);
                run(() => reorderProjects(next.map((r) => r.id)));
              }}
              className="divide-y divide-ivory/10 border-y border-ivory/10"
              itemClassName="bg-[#121110]"
              render={(p, handle, i) => (
                <div className="flex flex-wrap items-center gap-3 py-2 sm:flex-nowrap">
                  {handle}
                  <span className="t-meta-sm w-8 text-ash">{String(i + 1).padStart(2, "0")}</span>
                  <MediaThumb asset={p.coverId ? media[p.coverId] : undefined} media={media} className="h-10 w-14 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px]">
                      {p.title} {p.demo && <span className="t-meta-sm ml-1 bg-ivory/10 px-1 text-ash">demo</span>}
                    </p>
                    <p className="truncate text-[12px] text-ash">
                      {p.subtitle || "—"} · {p.year} · /work/{p.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Toggle label="Live" checked={p.published} onChange={(v) => flag(p.id, "published", v)} disabled={pending} />
                    <Toggle label="Featured" checked={p.featured} onChange={(v) => flag(p.id, "featured", v)} disabled={pending} />
                    <Link href={`/admin/projects/${p.id}`} className="flex h-8 w-8 items-center justify-center text-ash hover:text-ivory" aria-label={`Edit ${p.title}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center text-ash hover:text-red"
                      aria-label={`Delete ${p.title}`}
                      onClick={() => {
                        if (!confirm(`Delete “${p.title}”? This cannot be undone. Its media stays in the library.`)) return;
                        setRows((rs) => rs.filter((r) => r.id !== p.id));
                        setFeatured((fs) => fs.filter((r) => r.id !== p.id));
                        run(() => deleteProject(p.id), "Project deleted");
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            />
          )}
        </Section>

        <Section title="Selected Work order" hint="The homepage shows up to 6 featured projects in this order. 4–6 works best.">
          {featured.length === 0 ? (
            <p className="text-[13px] text-ash">Toggle “Featured” on a project to add it here.</p>
          ) : (
            <SortableList
              items={featured}
              onReorder={(next) => {
                setFeatured(next);
                run(() => reorderFeatured(next.map((r) => r.id)));
              }}
              className="space-y-1"
              itemClassName="border border-ivory/10 bg-ink"
              render={(p, handle, i) => (
                <div className="flex items-center gap-2 pr-2">
                  {handle}
                  <span className="t-display w-8 text-[22px] text-red">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1 truncate text-[14px]">{p.title}</span>
                  <span className="t-meta-sm text-ash">{p.featuredLayout}</span>
                  {!p.published && <span className="t-meta-sm text-[#ff8a7a]">hidden</span>}
                </div>
              )}
            />
          )}
          {featured.length > 6 && <Notice kind="info">Only the first 6 appear on the homepage.</Notice>}
        </Section>
      </div>
    </div>
  );
}
