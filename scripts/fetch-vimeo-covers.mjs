#!/usr/bin/env node
/**
 * Pulls the real Vimeo thumbnail for every "embed" video block in the
 * portfolio and turns it into the site's cover image, instead of the plain
 * black placeholder shown before the visitor clicks play.
 *
 * How it works:
 *   1. Finds every project block of type "embed" pointing at a Vimeo URL.
 *   2. Asks Vimeo's oEmbed API for that video's official thumbnail.
 *   3. Downloads the thumbnail into storage/uploads/ as a new image asset.
 *   4. Registers the Vimeo link itself as a media asset (kind "embed") with
 *      that thumbnail set as its poster.
 *   5. Rewrites the project's block to point at that asset (type "video"),
 *      so the existing player and the Media Library's poster picker both
 *      pick it up automatically.
 *
 * Usage:
 *   node scripts/fetch-vimeo-covers.mjs            # all projects
 *   node scripts/fetch-vimeo-covers.mjs nazca       # only projects whose
 *                                                    # slug/title contains "nazca"
 *
 * It's safe to run again any time: once a block is converted it becomes a
 * "video" block, so a second run has nothing left to touch. To change a
 * cover afterwards without this script, use the site's own admin panel:
 * /admin → Media → find the video link → "Poster" dropdown.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve(import.meta.dirname, "..");
const STORAGE_DIR = path.join(ROOT, "storage");
const UPLOAD_DIR = path.join(STORAGE_DIR, "uploads");
const CONTENT_FILE = path.join(STORAGE_DIR, "content.json");

const args = process.argv.slice(2);
const filter = args.find((a) => !a.startsWith("--"))?.toLowerCase();

const newId = (prefix) => `${prefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;

function parseVimeoId(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, "");
  if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;
  const m = u.pathname.match(/(?:^|\/)(\d{5,12})(?:\/|$)/);
  return m ? m[1] : null;
}

async function main() {
  const content = JSON.parse(await fs.readFile(CONTENT_FILE, "utf8"));
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  let converted = 0;
  let skipped = 0;
  let failed = 0;

  for (const project of content.projects) {
    if (filter && !project.slug.toLowerCase().includes(filter) && !project.title.toLowerCase().includes(filter)) continue;

    for (const block of project.blocks) {
      if (block.type !== "embed") continue;
      const vimeoId = parseVimeoId(block.url);
      if (!vimeoId) {
        console.log(`⚠︎  ${project.title}: embed block is not a Vimeo link, skipping (${block.url})`);
        continue;
      }

      console.log(`→ ${project.title}: fetching cover for vimeo.com/${vimeoId}…`);

      let oembed;
      try {
        const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(block.url)}&width=1920`);
        if (!res.ok) throw new Error(`oEmbed ${res.status}`);
        oembed = await res.json();
      } catch (e) {
        console.log(`  ✗ could not reach Vimeo's oEmbed API — ${e.message}`);
        failed++;
        continue;
      }

      const thumbUrl = oembed.thumbnail_url;
      if (!thumbUrl) {
        console.log("  ✗ Vimeo returned no thumbnail for this video");
        failed++;
        continue;
      }

      let imgRes;
      try {
        imgRes = await fetch(thumbUrl);
        if (!imgRes.ok) throw new Error(`thumbnail ${imgRes.status}`);
      } catch (e) {
        console.log(`  ✗ could not download the thumbnail — ${e.message}`);
        failed++;
        continue;
      }
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const ct = imgRes.headers.get("content-type") || "image/jpeg";
      const ext = ct.includes("webp") ? "webp" : ct.includes("png") ? "png" : "jpg";

      const posterId = newId("m");
      const posterFile = `${posterId.toLowerCase()}.${ext}`;
      await fs.writeFile(path.join(UPLOAD_DIR, posterFile), buf);

      const title = oembed.title || project.title;
      const now = new Date().toISOString();

      content.media.unshift({
        id: posterId,
        kind: "image",
        src: `/media/${posterFile}`,
        alt: `${title} — video cover`,
        width: oembed.thumbnail_width,
        height: oembed.thumbnail_height,
        mime: ct.split(";")[0],
        size: buf.length,
        origin: "upload",
        createdAt: now,
      });

      const embedId = newId("m");
      content.media.unshift({
        id: embedId,
        kind: "embed",
        src: block.url,
        provider: "vimeo",
        alt: title,
        width: 1920,
        height: 1080,
        posterId,
        origin: "remote",
        createdAt: now,
      });

      block.type = "video";
      block.assetId = embedId;
      block.autoplay = block.autoplay ?? false;
      delete block.url;

      project.updatedAt = now;
      converted++;
      console.log(`  ✓ cover saved (${posterFile}) and block now points at ${embedId}`);
    }
  }

  if (converted > 0) {
    const json = JSON.stringify(content, null, 2) + "\n";
    await fs.copyFile(CONTENT_FILE, path.join(STORAGE_DIR, "content.prev.json")).catch(() => {});
    await fs.writeFile(CONTENT_FILE, json, "utf8");
  }

  console.log(`\nDone — ${converted} cover(s) pulled, ${skipped} already done, ${failed} failed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
