import { createWriteStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { mutate, newId, READ_ONLY, READ_ONLY_MESSAGE, UPLOAD_DIR } from "@/lib/store";
import type { MediaAsset } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MB = 1024 * 1024;
const RULES: Record<string, { ext: string; kind: MediaAsset["kind"]; max: number; magic: (b: Buffer) => boolean }> = {
  "image/jpeg": { ext: "jpg", kind: "image", max: 20 * MB, magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { ext: "png", kind: "image", max: 20 * MB, magic: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": { ext: "webp", kind: "image", max: 20 * MB, magic: (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" },
  "image/avif": { ext: "avif", kind: "image", max: 20 * MB, magic: (b) => b.toString("ascii", 4, 8) === "ftyp" && /avi[fs]/.test(b.toString("ascii", 8, 12)) },
  "video/mp4": { ext: "mp4", kind: "video", max: 400 * MB, magic: (b) => b.toString("ascii", 4, 8) === "ftyp" },
  "video/webm": { ext: "webm", kind: "video", max: 400 * MB, magic: (b) => b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) },
  "application/pdf": { ext: "pdf", kind: "file", max: 15 * MB, magic: (b) => b.toString("ascii", 0, 5) === "%PDF-" },
};

const err = (status: number, error: string) => Response.json({ error }, { status });

/**
 * Raw-body upload (the browser sends the File as the request body), streamed to
 * disk so large videos never sit in memory and XHR can report progress.
 * Headers: Content-Type, Content-Length, x-alt, x-width, x-height (all optional except type).
 */
export async function POST(req: Request) {
  if (!(await isAdmin())) return err(401, "Not authorized");
  if (READ_ONLY) return err(409, READ_ONLY_MESSAGE);

  // CSRF: browser requests must come from this origin
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return err(403, "Cross-origin upload refused");

  const type = (req.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const rule = RULES[type];
  if (!rule) return err(415, "Unsupported file type. Use JPG, PNG, WebP, AVIF, MP4, WebM or PDF.");
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > rule.max) return err(413, `File too large. Max ${rule.max / MB} MB for ${type}.`);
  if (!req.body) return err(400, "Empty upload");

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const id = newId("m");
  const filename = `${id.toLowerCase()}.${rule.ext}`;
  const tmp = path.join(UPLOAD_DIR, `.${filename}.part`);
  const final = path.join(UPLOAD_DIR, filename);

  let bytes = 0;
  let head = Buffer.alloc(0);
  try {
    const source = Readable.fromWeb(req.body as import("node:stream/web").ReadableStream);
    source.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (head.length < 16) head = Buffer.concat([head, chunk.subarray(0, 16 - head.length)]);
      if (bytes > rule.max) source.destroy(new Error("TOO_LARGE"));
    });
    await pipeline(source, createWriteStream(tmp, { flags: "wx" }));
    if (bytes === 0) throw new Error("EMPTY");
    if (!rule.magic(head)) throw new Error("BAD_MAGIC");
    await fs.rename(tmp, final);
  } catch (e) {
    await fs.rm(tmp, { force: true });
    const m = (e as Error).message;
    if (m === "TOO_LARGE") return err(413, `File too large. Max ${rule.max / MB} MB.`);
    if (m === "BAD_MAGIC") return err(415, "The file contents don't match its type.");
    if (m === "EMPTY") return err(400, "Empty file");
    return err(500, "Upload failed while writing to disk");
  }

  const int = (v: string | null) => {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 && n < 20000 ? n : undefined;
  };
  const alt = decodeURIComponent(req.headers.get("x-alt") ?? "").slice(0, 300);
  const asset: MediaAsset = {
    id,
    kind: rule.kind,
    src: `/media/${filename}`,
    alt,
    width: int(req.headers.get("x-width")),
    height: int(req.headers.get("x-height")),
    mime: type,
    size: bytes,
    origin: "upload",
    createdAt: new Date().toISOString(),
  };
  try {
    await mutate((c) => {
      c.media.unshift(asset);
    });
  } catch {
    await fs.rm(final, { force: true });
    return err(500, "Could not register the file");
  }
  revalidatePath("/", "layout");
  return Response.json({ asset });
}
