/**
 * Contact-form inbox, stored next to content.json as `messages.json`.
 * Same guarantees as the content store: serialized writes, atomic rename.
 * Read in /admin → Messages.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { READ_ONLY, STORAGE_DIR, newId } from "./store";
import { contactMessageSchema, type ContactMessage } from "./types";

const FILE = path.join(STORAGE_DIR, "messages.json");
const MAX_KEPT = 2000;
let queue: Promise<unknown> = Promise.resolve();

export async function readMessages(): Promise<ContactMessage[]> {
  try {
    return z.array(contactMessageSchema).parse(JSON.parse(await fs.readFile(FILE, "utf8")));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw new Error(`messages.json is unreadable or invalid: ${(err as Error).message}`);
  }
}

async function write(list: ContactMessage[]) {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  const handle = await fs.open(tmp, "w");
  try {
    await handle.writeFile(JSON.stringify(list, null, 2), "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fs.rename(tmp, FILE);
}

/** Serialized read-modify-write of the inbox. */
export function mutateMessages<T>(fn: (list: ContactMessage[]) => T): Promise<T> {
  const run = queue.then(async () => {
    if (READ_ONLY) throw new Error("read-only");
    const list = await readMessages();
    const result = fn(list);
    await write(list.slice(0, MAX_KEPT));
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export function addMessage(input: Pick<ContactMessage, "name" | "email" | "message">) {
  return mutateMessages((list) => {
    list.unshift({ ...input, id: newId("msg"), createdAt: new Date().toISOString(), read: false });
  });
}

/* In-memory flood guard: 3 messages / 10 min per IP. */
const sent = new Map<string, number[]>();
export function contactAllowed(ip: string) {
  const now = Date.now();
  const recent = (sent.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (recent.length >= 3) return false;
  sent.set(ip, [...recent, now]);
  return true;
}
