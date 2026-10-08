import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "node:crypto";
import { SESSION_COOKIE, SESSION_TTL_S, sessionSecret, signSession, verifySession } from "./session";

export class UnauthorizedError extends Error {
  constructor() {
    super("Not authorized");
  }
}

/** Why the admin is unavailable, if it is. */
export function adminConfigProblem(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw.length < 12) return "ADMIN_PASSWORD is missing or shorter than 12 characters.";
  if (!sessionSecret()) return "SESSION_SECRET is missing or shorter than 32 characters.";
  return null;
}

export function passwordMatches(input: string) {
  const pw = process.env.ADMIN_PASSWORD ?? "";
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(pw).digest();
  return pw.length >= 12 && timingSafeEqual(a, b);
}

export async function isAdmin() {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value, sessionSecret());
}

/** Call at the top of every privileged server action / route handler. */
export async function requireAdmin() {
  if (!(await isAdmin())) throw new UnauthorizedError();
}

export async function startSession() {
  const secret = sessionSecret();
  if (!secret) throw new Error("SESSION_SECRET not configured");
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_S,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/* Simple in-memory login throttle: 5 attempts / 15 min per IP. */
const attempts = new Map<string, { count: number; until: number }>();
export function throttle(ip: string): { allowed: boolean; retryInMin?: number } {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || rec.until < now) {
    attempts.set(ip, { count: 1, until: now + 15 * 60_000 });
    return { allowed: true };
  }
  rec.count += 1;
  if (rec.count > 5) return { allowed: false, retryInMin: Math.ceil((rec.until - now) / 60_000) };
  return { allowed: true };
}
export function clearThrottle(ip: string) {
  attempts.delete(ip);
}
