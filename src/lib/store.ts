/**
 * File-backed content store.
 *
 * - Content lives in `${STORAGE_DIR}/content.json` (default ./storage).
 * - Writes are serialized through a promise queue and committed atomically
 *   (write temp file → fsync → rename), so a crash never leaves a half file.
 * - Every write keeps the previous version as content.prev.json.
 * - Reads are cached by file mtime.
 *
 * Swap this module for a database adapter without touching the UI:
 * everything else goes through `readContent()` / `mutate()`.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { contentSchema, type Content } from "./types";
import { seedContent } from "./seed";

export const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR || path.join(process.cwd(), "storage"));
export const UPLOAD_DIR = path.join(STORAGE_DIR, "uploads");
const CONTENT_FILE = path.join(STORAGE_DIR, "content.json");

let cache: { mtimeMs: number; data: Content } | null = null;
let queue: Promise<unknown> = Promise.resolve();

async function ensureDirs() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export async function readContent(): Promise<Content> {
  try {
    const stat = await fs.stat(CONTENT_FILE);
    if (cache && cache.mtimeMs === stat.mtimeMs) return cache.data;
    const raw = await fs.readFile(CONTENT_FILE, "utf8");
    const data = contentSchema.parse(JSON.parse(raw));
    cache = { mtimeMs: stat.mtimeMs, data };
    return data;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      // First run: serve seed content (written on first mutation).
      return structuredClone(seedContent);
    }
    throw new Error(`content.json is unreadable or invalid: ${(err as Error).message}`);
  }
}

/** Serverless hosts (Vercel) have a read-only, non-persistent filesystem. */
export const READ_ONLY = process.env.CONTENT_READONLY === "1" || !!process.env.VERCEL;
export const READ_ONLY_MESSAGE =
  "This deployment is read-only, so edits can't be saved here. Edit content on your local copy (npm run dev → /admin), commit the storage/ folder and push — see README.";

async function commit(data: Content) {
  if (READ_ONLY) throw new Error(READ_ONLY_MESSAGE);
  await ensureDirs();
  const valid = contentSchema.parse(data);
  const json = JSON.stringify(valid, null, 2);
  const tmp = `${CONTENT_FILE}.${process.pid}.${Date.now()}.tmp`;
  const handle = await fs.open(tmp, "w");
  try {
    await handle.writeFile(json, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await fs.copyFile(CONTENT_FILE, path.join(STORAGE_DIR, "content.prev.json"));
  } catch {
    /* first write: nothing to back up */
  }
  await fs.rename(tmp, CONTENT_FILE);
  cache = null;
}

/** Serialized read-modify-write. The mutator may throw to abort. */
export function mutate<T>(fn: (draft: Content) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const draft = structuredClone(await readContent());
    const result = await fn(draft);
    await commit(draft);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}
