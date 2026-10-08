import type { Content } from "./types";

/** Human-readable list of every place a media asset is used. */
export function findReferences(c: Content, id: string): string[] {
  const refs: string[] = [];
  const s = c.settings;
  if (s.hero.portraitDesktopId === id) refs.push("Settings → Hero portrait (desktop)");
  if (s.hero.portraitMobileId === id) refs.push("Settings → Hero portrait (mobile)");
  if (s.about.portraitId === id) refs.push("Settings → About portrait");
  if (s.cv.assetId === id) refs.push("Settings → CV file");
  for (const m of c.media) if (m.posterId === id) refs.push(`Media → poster of “${m.alt || m.id}”`);
  for (const p of c.projects) {
    if (p.coverId === id) refs.push(`${p.title} → cover`);
    if (p.coverVideoId === id) refs.push(`${p.title} → cover video`);
    p.blocks.forEach((b, i) => {
      const ids = "assetIds" in b ? b.assetIds : "assetId" in b ? [b.assetId] : [];
      if (ids.includes(id)) refs.push(`${p.title} → block ${i + 1} (${b.type})`);
    });
  }
  return refs;
}

export function referenceCounts(c: Content): Record<string, string[]> {
  return Object.fromEntries(c.media.map((m) => [m.id, findReferences(c, m.id)]));
}
